package com.hispread.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import javax.net.ssl.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

/** Bounded CONNECT / SOCKS5 authentication and HTTPS egress check; never sends target credentials. */
@Service
public class ProxyProbeService {
  private final Store store;
  private final Environment environment;
  private final SSLSocketFactory tls;
  @Value("${app.integrations.allow-private-targets:false}") boolean allowPrivateTargets;
  @Value("${app.integrations.proxy-probe-url:https://api.ipify.org?format=json}")
  String probeUrl = "https://api.ipify.org?format=json";
  @Value("${app.integrations.proxy-probe-timeout-ms:10000}") int timeoutMs = 10000;

  @org.springframework.beans.factory.annotation.Autowired
  public ProxyProbeService(Store store, Environment environment) {
    this(store, environment, (SSLSocketFactory) SSLSocketFactory.getDefault());
  }

  ProxyProbeService(Store store, Environment environment, SSLSocketFactory tls) {
    this.store = store;
    this.environment = environment;
    this.tls = tls;
  }

  private boolean testPrivate() {
    return allowPrivateTargets && Arrays.stream(environment.getActiveProfiles())
        .anyMatch(p -> Set.of("test", "integration-test").contains(p))
        && Arrays.stream(environment.getActiveProfiles()).noneMatch("production"::equals);
  }

  static URI parseProxy(String raw) {
    try {
      URI uri = URI.create(raw);
      if (uri.getScheme() == null || !Set.of("http", "https", "socks5").contains(uri.getScheme().toLowerCase(Locale.ROOT))
          || uri.getHost() == null || uri.getPort() < 1 || uri.getPort() > 65535
          || uri.getRawQuery() != null || uri.getRawFragment() != null
          || !(uri.getRawPath() == null || uri.getRawPath().isEmpty() || uri.getRawPath().equals("/")))
        throw new IllegalArgumentException();
      if (uri.getRawUserInfo() != null) credentials(uri);
      return uri;
    } catch (RuntimeException e) {
      throw new ApiException(400, "请填写有效的HTTP、HTTPS或SOCKS5代理URL（含端口）", "INVALID_PROXY_URL");
    }
  }

  private static String[] credentials(URI proxy) {
    String userInfo = proxy.getRawUserInfo();
    if (userInfo == null) return null;
    int colon = userInfo.indexOf(':');
    if (colon < 1) throw new IllegalArgumentException();
    String user = URLDecoder.decode(userInfo.substring(0, colon).replace("+", "%2B"), StandardCharsets.UTF_8);
    String password = URLDecoder.decode(userInfo.substring(colon + 1).replace("+", "%2B"), StandardCharsets.UTF_8);
    if (user.contains(":") || user.contains("\r") || user.contains("\n") || password.contains("\r") || password.contains("\n")
        || user.getBytes(StandardCharsets.UTF_8).length > 255 || password.getBytes(StandardCharsets.UTF_8).length > 255)
      throw new IllegalArgumentException();
    return new String[] {user, password};
  }

  public ObjectNode probe(String raw) {
    URI proxy = parseProxy(raw);
    URI target;
    try {
      target = URI.create(probeUrl);
      if (!"https".equals(target.getScheme()) || target.getHost() == null
          || target.getUserInfo() != null || target.getFragment() != null)
        throw new IllegalArgumentException();
    } catch (RuntimeException e) {
      throw new ApiException(503, "代理出口检测目标配置无效", "INVALID_PROXY_PROBE_TARGET");
    }
    InetAddress proxyAddress = OutboundAddressPolicy.resolve(proxy.getHost(), testPrivate())[0];
    InetAddress targetAddress = OutboundAddressPolicy.resolve(target.getHost(), testPrivate())[0];
    long started = System.nanoTime();
    long deadline = started + Math.max(1000, Math.min(30000, timeoutMs)) * 1000000L;
    ObjectNode result = store.object().put("checkedAt", Instant.now().toString())
        .put("protocol", proxy.getScheme().toUpperCase(Locale.ROOT));
    try (Socket transport = new Socket()) {
      transport.connect(new InetSocketAddress(proxyAddress, proxy.getPort()), remaining(deadline));
      Socket tunnel = proxy.getScheme().equalsIgnoreCase("https")
          ? secure(transport, proxy.getHost(), proxy.getPort(), deadline) : transport;
      String[] credential = credentials(proxy);
      int targetPort = target.getPort() < 0 ? 443 : target.getPort();
      if (proxy.getScheme().equalsIgnoreCase("socks5"))
        socks(tunnel, targetAddress, targetPort, credential, deadline);
      else connect(tunnel, targetAddress, targetPort, credential, deadline);
      try (Socket secureTarget = secure(tunnel, target.getHost(), targetPort, deadline)) {
        String path = target.getRawPath();
        if (path == null || path.isEmpty()) path = "/";
        if (target.getRawQuery() != null) path += "?" + target.getRawQuery();
        String authority = target.getHost().contains(":") ? "[" + target.getHost() + "]" : target.getHost();
        if (targetPort != 443) authority += ":" + targetPort;
        secureTarget.getOutputStream().write(("GET " + path + " HTTP/1.1\r\nHost: " + authority
            + "\r\nAccept: application/json\r\nAccept-Encoding: identity\r\nConnection: close\r\n\r\n")
            .getBytes(StandardCharsets.US_ASCII));
        secureTarget.getOutputStream().flush();
        Headers headers = headers(secureTarget, deadline);
        if (headers.status != 200) throw new ProbeFailure("EGRESS_FAILED", "代理出口检测服务返回失败");
        byte[] bytes = body(secureTarget, headers, deadline);
        JsonNode json;
        try { json = store.json.readTree(bytes); }
        catch (IOException e) { throw new ProbeFailure("INVALID_EGRESS", "出口检测未返回有效IP地址"); }
        String ip = json == null ? "" : json.path("ip").asText();
        if (!ip.matches("[0-9a-fA-F:.]{3,64}"))
          throw new ProbeFailure("INVALID_EGRESS", "出口检测未返回有效IP地址");
        InetAddress exit;
        try { exit = InetAddress.getByName(ip); }
        catch (UnknownHostException e) { throw new ProbeFailure("INVALID_EGRESS", "出口检测未返回有效IP地址"); }
        if (!OutboundAddressPolicy.publicAddress(exit))
          throw new ProbeFailure("INVALID_EGRESS", "出口检测返回非公网IP地址");
        result.put("ok", true).put("state", "VERIFIED").put("exitIp", exit.getHostAddress())
            .put("authenticationVerified", credential != null).put("egressVerified", true)
            .put("message", "代理握手与HTTPS出口检测成功");
      }
    } catch (ProbeFailure e) {
      result.put("ok", false).put("state", e.state).put("message", e.getMessage());
    } catch (SocketTimeoutException e) {
      result.put("ok", false).put("state", "TIMEOUT").put("message", "代理握手或出口检测超时");
    } catch (SSLException e) {
      result.put("ok", false).put("state", "TLS_FAILED").put("message", "代理或检测服务TLS证书验证失败");
    } catch (IOException e) {
      result.put("ok", false).put("state", "UNREACHABLE").put("message", "代理连接或出口请求失败");
    }
    return result.put("latencyMs", (System.nanoTime() - started) / 1000000);
  }

  private Socket secure(Socket socket, String host, int port, long deadline) throws IOException {
    SSLSocket secure = (SSLSocket) tls.createSocket(socket, host, port, false);
    SSLParameters parameters = secure.getSSLParameters();
    parameters.setEndpointIdentificationAlgorithm("HTTPS");
    secure.setSSLParameters(parameters);
    secure.setSoTimeout(remaining(deadline));
    secure.startHandshake();
    return secure;
  }

  private static int remaining(long deadline) throws SocketTimeoutException {
    long remaining = (deadline - System.nanoTime()) / 1000000;
    if (remaining <= 0) throw new SocketTimeoutException();
    return (int) Math.min(Integer.MAX_VALUE, remaining);
  }

  private static int read(Socket socket, long deadline) throws IOException {
    socket.setSoTimeout(remaining(deadline));
    int value = socket.getInputStream().read();
    if (value < 0) throw new EOFException();
    return value;
  }

  private static void socks(Socket socket, InetAddress target, int port, String[] credentials, long deadline)
      throws IOException {
    OutputStream output = socket.getOutputStream();
    output.write(new byte[] {5, 1, (byte) (credentials == null ? 0 : 2)});
    output.flush();
    int version = read(socket, deadline), method = read(socket, deadline);
    if (version != 5) throw new ProbeFailure("PROTOCOL_FAILED", "服务不支持SOCKS5握手");
    if (method != (credentials == null ? 0 : 2))
      throw new ProbeFailure("AUTH_FAILED", "SOCKS5认证方式被拒绝");
    if (credentials != null) {
      byte[] user = credentials[0].getBytes(StandardCharsets.UTF_8), password = credentials[1].getBytes(StandardCharsets.UTF_8);
      if (password.length == 0) throw new ProbeFailure("AUTH_FAILED", "SOCKS5密码不能为空");
      output.write(1); output.write(user.length); output.write(user); output.write(password.length); output.write(password); output.flush();
      if (read(socket, deadline) != 1 || read(socket, deadline) != 0)
        throw new ProbeFailure("AUTH_FAILED", "SOCKS5用户名或密码认证失败");
    }
    byte[] address = target.getAddress();
    output.write(new byte[] {5, 1, 0, (byte) (address.length == 4 ? 1 : 4)});
    output.write(address); output.write(port >>> 8); output.write(port & 255); output.flush();
    if (read(socket, deadline) != 5) throw new ProbeFailure("PROTOCOL_FAILED", "SOCKS5连接响应无效");
    if (read(socket, deadline) != 0) throw new ProbeFailure("EGRESS_FAILED", "SOCKS5拒绝出口连接");
    if (read(socket, deadline) != 0) throw new ProbeFailure("PROTOCOL_FAILED", "SOCKS5连接响应无效");
    int type = read(socket, deadline);
    int length = type == 1 ? 4 : type == 4 ? 16 : type == 3 ? read(socket, deadline) : -1;
    if (length < 0) throw new ProbeFailure("PROTOCOL_FAILED", "SOCKS5地址类型无效");
    for (int i = 0; i < length + 2; i++) read(socket, deadline);
  }

  private static void connect(Socket socket, InetAddress target, int port, String[] credentials, long deadline)
      throws IOException {
    String host = target.getHostAddress();
    String authority = (host.contains(":") ? "[" + host + "]" : host) + ":" + port;
    String request = "CONNECT " + authority + " HTTP/1.1\r\nHost: " + authority + "\r\n";
    if (credentials != null) request += "Proxy-Authorization: Basic " + Base64.getEncoder()
        .encodeToString((credentials[0] + ":" + credentials[1]).getBytes(StandardCharsets.UTF_8)) + "\r\n";
    socket.getOutputStream().write((request + "\r\n").getBytes(StandardCharsets.US_ASCII));
    socket.getOutputStream().flush();
    int status = headers(socket, deadline).status;
    if (status == 407) throw new ProbeFailure("AUTH_FAILED", "HTTP代理认证失败");
    if (status < 200 || status >= 300) throw new ProbeFailure("PROTOCOL_FAILED", "HTTP代理未建立CONNECT隧道");
  }

  private record Headers(int status, Map<String, String> values) {}

  private static Headers headers(Socket socket, long deadline) throws IOException {
    ByteArrayOutputStream buffer = new ByteArrayOutputStream();
    int matched = 0;
    byte[] ending = {13, 10, 13, 10};
    while (matched < 4) {
      int b = read(socket, deadline); buffer.write(b);
      matched = b == ending[matched] ? matched + 1 : b == 13 ? 1 : 0;
      if (buffer.size() > 16384) throw new ProbeFailure("PROTOCOL_FAILED", "代理响应头过大");
    }
    String[] lines = buffer.toString(StandardCharsets.ISO_8859_1).split("\r\n");
    if (!lines[0].matches("HTTP/1\\.[01] [0-9]{3}( .*)?"))
      throw new ProbeFailure("PROTOCOL_FAILED", "代理HTTP响应无效");
    Map<String, String> values = new HashMap<>();
    for (int i = 1; i < lines.length; i++) {
      int colon = lines[i].indexOf(':');
      if (colon <= 0) throw new ProbeFailure("PROTOCOL_FAILED", "代理HTTP响应头无效");
      String name = lines[i].substring(0, colon).toLowerCase(Locale.ROOT);
      if (values.putIfAbsent(name, lines[i].substring(colon + 1).trim()) != null)
        throw new ProbeFailure("PROTOCOL_FAILED", "代理HTTP响应头重复");
    }
    return new Headers(Integer.parseInt(lines[0].substring(9, 12)), values);
  }

  private static byte[] body(Socket socket, Headers headers, long deadline) throws IOException {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    String transfer = headers.values.getOrDefault("transfer-encoding", "");
    if (!transfer.isEmpty()) {
      if (!transfer.equalsIgnoreCase("chunked") || headers.values.containsKey("content-length"))
        throw new ProbeFailure("PROTOCOL_FAILED", "出口HTTP消息格式无效");
      for (;;) {
        String line = line(socket, deadline);
        int length;
        try { length = Integer.parseInt(line.split(";", 2)[0], 16); }
        catch (RuntimeException e) { throw new ProbeFailure("PROTOCOL_FAILED", "出口HTTP分块无效"); }
        if (length < 0 || length > 16384 - out.size()) throw new ProbeFailure("INVALID_EGRESS", "出口响应过大");
        if (length == 0) return out.toByteArray();
        for (int i = 0; i < length; i++) out.write(read(socket, deadline));
        if (!line(socket, deadline).isEmpty()) throw new ProbeFailure("PROTOCOL_FAILED", "出口HTTP分块无效");
      }
    }
    String size = headers.values.get("content-length");
    int length = -1;
    if (size != null) {
      try { length = Integer.parseInt(size); }
      catch (NumberFormatException e) { throw new ProbeFailure("PROTOCOL_FAILED", "出口HTTP长度无效"); }
      if (length < 0 || length > 16384) throw new ProbeFailure("INVALID_EGRESS", "出口响应过大");
    }
    if (length >= 0) for (int i = 0; i < length; i++) out.write(read(socket, deadline));
    else {
      for (int i = 0; i <= 16384; i++) {
        socket.setSoTimeout(remaining(deadline));
        int b = socket.getInputStream().read();
        if (b < 0) return out.toByteArray();
        out.write(b);
      }
      throw new ProbeFailure("INVALID_EGRESS", "出口响应过大");
    }
    return out.toByteArray();
  }

  private static String line(Socket socket, long deadline) throws IOException {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    while (out.size() < 256) {
      int b = read(socket, deadline);
      if (b == 13) {
        if (read(socket, deadline) != 10) break;
        return out.toString(StandardCharsets.US_ASCII);
      }
      out.write(b);
    }
    throw new ProbeFailure("PROTOCOL_FAILED", "出口HTTP分块行无效");
  }

  private static class ProbeFailure extends IOException {
    final String state;
    ProbeFailure(String state, String message) { super(message); this.state = state; }
  }
}
