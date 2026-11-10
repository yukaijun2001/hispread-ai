package com.hispread.ai;

import java.net.*;

/** Shared policy for all server-owned outbound targets, including resolved proxy destinations. */
final class OutboundAddressPolicy {
  private OutboundAddressPolicy() {}

  static boolean publicAddress(InetAddress address) {
    if (address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isLinkLocalAddress()
        || address.isSiteLocalAddress() || address.isMulticastAddress()) return false;
    byte[] b = address.getAddress();
    if (b.length == 4) {
      int first = b[0] & 255, second = b[1] & 255;
      return first != 0 && first != 127 && first < 224
          && !(first == 100 && second >= 64 && second <= 127)
          && !(first == 169 && second == 254)
          && !(first == 198 && (second == 18 || second == 19));
    }
    // Unique-local IPv6 is not covered by InetAddress.isSiteLocalAddress().
    return (b[0] & 0xfe) != 0xfc;
  }

  static InetAddress[] resolve(String host, boolean testPrivate) {
    try {
      InetAddress[] addresses = InetAddress.getAllByName(host);
      for (InetAddress address : addresses)
        if (!testPrivate && !publicAddress(address))
          throw new ApiException(400, "禁止连接内网、环回或链路本地目标", "UNSAFE_RESOURCE_TARGET");
      return addresses;
    } catch (UnknownHostException e) {
      throw new ApiException(502, "上游目标域名无法解析", "RESOURCE_UPSTREAM_DNS_FAILED");
    }
  }
}
