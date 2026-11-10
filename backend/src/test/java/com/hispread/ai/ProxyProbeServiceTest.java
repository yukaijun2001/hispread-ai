package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import javax.net.ssl.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class ProxyProbeServiceTest {
  final Store store = new Store(null, new ObjectMapper());

  static SSLContext context() throws Exception {
    java.security.cert.Certificate cert;
    try (InputStream input = ProxyProbeServiceTest.class.getResourceAsStream("/proxy/localhost-cert.pem")) {
      cert = CertificateFactory.getInstance("X.509").generateCertificate(input);
    }
    String pem;
    try (InputStream input = ProxyProbeServiceTest.class.getResourceAsStream("/proxy/localhost-key.pem")) {
      pem = new String(input.readAllBytes(), StandardCharsets.US_ASCII)
          .replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replaceAll("\\s", "");
    }
    PrivateKey key = KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(pem)));
    KeyStore keys = KeyStore.getInstance("PKCS12"); keys.load(null);
    keys.setKeyEntry("fixture", key, "fixture".toCharArray(), new java.security.cert.Certificate[] {cert});
    KeyManagerFactory km = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm()); km.init(keys, "fixture".toCharArray());
    TrustManagerFactory tm = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm()); tm.init(keys);
    SSLContext context = SSLContext.getInstance("TLS"); context.init(km.getKeyManagers(), tm.getTrustManagers(), null); return context;
  }

  static Socket serverTls(Socket socket, SSLContext context) throws Exception {
    SSLSocket secure = (SSLSocket) context.getSocketFactory().createSocket(socket, "localhost", socket.getPort(), false);
    secure.setUseClientMode(false); secure.setSoTimeout(5000); secure.startHandshake(); return secure;
  }

  static String headers(Socket socket) throws Exception {
    ByteArrayOutputStream out = new ByteArrayOutputStream(); int matched = 0;
    for (int b; matched < 4;) { b = socket.getInputStream().read(); if (b < 0) throw new EOFException(); out.write(b); matched = b == new int[]{13,10,13,10}[matched] ? matched + 1 : b == 13 ? 1 : 0; }
    return out.toString(StandardCharsets.US_ASCII);
  }

  interface Conversation { void run(Socket socket, SSLContext context) throws Exception; }
  final class Fixture implements AutoCloseable {
    final SSLContext context = context();
    final ServerSocket server = new ServerSocket(0, 1, InetAddress.getByName("localhost"));
    final ExecutorService executor = Executors.newSingleThreadExecutor();
    final Future<?> worker;
    final AtomicReference<Throwable> error = new AtomicReference<>();
    Fixture(Conversation conversation) throws Exception {
      worker = executor.submit(() -> { try (Socket socket = server.accept()) { socket.setSoTimeout(5000); conversation.run(socket, context); } catch (Throwable e) { error.set(e); } });
    }
    ProxyProbeService probe() {
      MockEnvironment environment = new MockEnvironment(); environment.setActiveProfiles("test");
      ProxyProbeService service = new ProxyProbeService(store, environment, context.getSocketFactory());
      service.allowPrivateTargets = true; service.probeUrl = "https://localhost/egress"; service.timeoutMs = 2000; return service;
    }
    String url(String scheme) { return scheme + "://user:p%40ss%3Aword@localhost:" + server.getLocalPort(); }
    public void close() throws Exception { server.close(); executor.shutdownNow(); worker.get(6, TimeUnit.SECONDS); }
  }

  static void egress(Socket tunnel, SSLContext context, boolean chunked) throws Exception {
    try (Socket target = serverTls(tunnel, context)) {
      String request = headers(target);
      assertTrue(request.startsWith("GET /egress HTTP/1.1\r\n"));
      assertTrue(request.contains("Host: localhost\r\n"));
      assertFalse(request.contains("Proxy-Authorization"));
      String body = "{\"ip\":\"8.8.8.8\"}";
      String response = chunked ? "Transfer-Encoding: chunked\r\n\r\n" + Integer.toHexString(body.length()) + "\r\n" + body + "\r\n0\r\n\r\n"
          : "Content-Length: " + body.length() + "\r\n\r\n" + body;
      target.getOutputStream().write(("HTTP/1.1 200 OK\r\n" + response).getBytes(StandardCharsets.US_ASCII)); target.getOutputStream().flush();
    }
  }

  @Test void connectAndTlsProxyVerifyCredentialsAndRealTlsEgress() throws Exception {
    for (String scheme : List.of("http", "https")) {
      try (Fixture fixture = new Fixture((raw, context) -> {
        Socket socket = scheme.equals("https") ? serverTls(raw, context) : raw;
        String request = headers(socket);
        assertTrue(request.startsWith("CONNECT "));
        assertTrue(request.contains("Proxy-Authorization: Basic " + Base64.getEncoder().encodeToString("user:p@ss:word".getBytes(StandardCharsets.UTF_8))));
        socket.getOutputStream().write("HTTP/1.1 200 Connection Established\r\n\r\n".getBytes(StandardCharsets.US_ASCII)); socket.getOutputStream().flush();
        egress(socket, context, scheme.equals("https"));
      })) {
        ObjectNode result = fixture.probe().probe(fixture.url(scheme));
        assertTrue(result.path("ok").asBoolean(), result.toString()); assertEquals("VERIFIED", result.path("state").asText());
        assertEquals("8.8.8.8", result.path("exitIp").asText()); assertTrue(result.path("authenticationVerified").asBoolean());
        assertFalse(result.toString().contains("p@ss")); assertNull(fixture.error.get());
      }
    }
  }

  @Test void socks5AuthenticatesAndVerifiesEgressOverRealTunnel() throws Exception {
    try (Fixture fixture = new Fixture((socket, context) -> {
      InputStream in = socket.getInputStream(); OutputStream out = socket.getOutputStream();
      assertArrayEquals(new byte[]{5,1,2}, in.readNBytes(3)); out.write(new byte[]{5,2}); out.flush();
      assertEquals(1, in.read()); String user = new String(in.readNBytes(in.read()), StandardCharsets.UTF_8); String password = new String(in.readNBytes(in.read()), StandardCharsets.UTF_8);
      assertEquals("user", user); assertEquals("p@ss:word", password); out.write(new byte[]{1,0}); out.flush();
      byte[] prefix = in.readNBytes(4); assertEquals(5, prefix[0]); assertEquals(1, prefix[1]);
      in.readNBytes(prefix[3] == 1 ? 6 : 18); out.write(new byte[]{5,0,0,1,0,0,0,0,0,0}); out.flush();
      egress(socket, context, false);
    })) {
      ObjectNode result = fixture.probe().probe(fixture.url("socks5")); assertEquals("VERIFIED", result.path("state").asText(), result.toString()); assertNull(fixture.error.get());
    }
  }

  @Test void proxyAuthFailureAndPlainTcpReachabilityNeverClaimSuccess() throws Exception {
    try (Fixture fixture = new Fixture((socket, context) -> { headers(socket); socket.getOutputStream().write("HTTP/1.1 407 Proxy Authentication Required\r\n\r\n".getBytes(StandardCharsets.US_ASCII)); })) {
      ObjectNode result = fixture.probe().probe(fixture.url("http")); assertEquals("AUTH_FAILED", result.path("state").asText()); assertFalse(result.path("ok").asBoolean());
    }
    try (Fixture fixture = new Fixture((socket, context) -> { headers(socket); socket.getOutputStream().write("HTTP/1.1 200 OK\r\n\r\n".getBytes(StandardCharsets.US_ASCII)); })) {
      ObjectNode result = fixture.probe().probe(fixture.url("http")); assertFalse(result.path("ok").asBoolean()); assertNotEquals("VERIFIED", result.path("state").asText());
    }
    try (Fixture fixture = new Fixture((socket, context) -> { assertArrayEquals(new byte[]{5,1,2}, socket.getInputStream().readNBytes(3)); socket.getOutputStream().write(new byte[]{5, (byte)255}); })) {
      assertEquals("AUTH_FAILED", fixture.probe().probe(fixture.url("socks5")).path("state").asText());
    }
  }

  @Test void privateAndCarrierGradeTargetsBlockedEvenWithProductionTestProfiles() {
    MockEnvironment environment = new MockEnvironment(); environment.setActiveProfiles("test", "production");
    ProxyProbeService service = new ProxyProbeService(store, environment); service.allowPrivateTargets = true;
    assertEquals("UNSAFE_RESOURCE_TARGET", assertThrows(ApiException.class, () -> service.probe("http://127.0.0.1:8080")).code);
    assertFalse(OutboundAddressPolicy.publicAddress(address("100.127.255.254")));
    assertFalse(OutboundAddressPolicy.publicAddress(address("fc00::1")));
    assertEquals("INVALID_PROXY_URL", assertThrows(ApiException.class, () -> service.probe("http://u:p@localhost:1234/credentials")).code);
  }
  static InetAddress address(String host) { try { return InetAddress.getByName(host); } catch (Exception e) { throw new RuntimeException(e); } }
}
