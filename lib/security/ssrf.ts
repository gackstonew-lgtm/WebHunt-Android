import dns from 'dns';
import { promisify } from 'util';
import net from 'net';

const lookupAsync = promisify(dns.lookup);

/**
 * IP / CIDR check helper
 */
function isPrivateOrReservedIp(ip: string): boolean {
  if (!ip) return true;

  // Handle IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
  let cleanIp = ip.toLowerCase().trim();
  if (cleanIp.startsWith('::ffff:')) {
    cleanIp = cleanIp.slice(7);
  }

  const ipFamily = net.isIP(cleanIp);
  if (ipFamily === 0) {
    return true; // Invalid IP format is treated as unsafe
  }

  if (ipFamily === 4) {
    const parts = cleanIp.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;

    const [a, b, c, d] = parts;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;

    // 10.0.0.0/8 (Private)
    if (a === 10) return true;

    // 100.64.0.0/10 (Carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;

    // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
    if (a === 169 && b === 254) return true;

    // 172.16.0.0/12 (Private 172.16.0.0 – 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0 && c === 0) return true;

    // 192.0.2.0/24 (TEST-NET-1)
    if (a === 192 && b === 0 && c === 2) return true;

    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;

    // 198.18.0.0/15 (Benchmarking)
    if (a === 198 && (b === 18 || b === 19)) return true;

    // 198.51.100.0/24 (TEST-NET-2)
    if (a === 198 && b === 51 && c === 100) return true;

    // 203.0.113.0/24 (TEST-NET-3)
    if (a === 203 && b === 0 && c === 113) return true;

    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;

    // 240.0.0.0/4 (Reserved / Future Use)
    if (a >= 240) return true;

    return false;
  }

  if (ipFamily === 6) {
    // IPv6 Loopback (::1)
    if (cleanIp === '::1' || cleanIp === '0:0:0:0:0:0:0:1') return true;

    // IPv6 Unspecified (::)
    if (cleanIp === '::' || cleanIp === '0:0:0:0:0:0:0:0') return true;

    // Unique Local Addresses (fc00::/7 -> fc00:: or fd00::)
    if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return true;

    // Link-Local Addresses (fe80::/10)
    if (cleanIp.startsWith('fe8') || cleanIp.startsWith('fe9') || cleanIp.startsWith('fea') || cleanIp.startsWith('feb')) return true;

    // Multicast (ff00::/8)
    if (cleanIp.startsWith('ff')) return true;

    return false;
  }

  return true;
}

const FORBIDDEN_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.google.internal',
  'instance-data',
  '169.254.169.254',
]);

export interface SsrCheckResult {
  isSafe: boolean;
  reason?: string;
  resolvedIp?: string;
  parsedUrl?: URL;
}

/**
 * Validates a URL against SSRF attacks including DNS resolution check
 */
export async function validateUrlForSsrf(rawUrl: string): Promise<SsrCheckResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isSafe: false, reason: 'Empty or invalid URL input' };
  }

  let candidate = rawUrl.trim();
  if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { isSafe: false, reason: 'Malformed URL' };
  }

  // 1. Protocol restriction: only http and https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isSafe: false, reason: `Disallowed protocol: ${parsed.protocol}` };
  }

  // 2. Disallow credentials in URL (user:pass@host)
  if (parsed.username || parsed.password) {
    return { isSafe: false, reason: 'Embedded URL credentials are not permitted' };
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // 3. Check forbidden literal hostnames
  if (
    FORBIDDEN_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.corp') ||
    hostname.endsWith('.home') ||
    hostname.endsWith('.invalid')
  ) {
    return { isSafe: false, reason: `Restricted hostname or internal domain: ${hostname}` };
  }

  // 4. Check if hostname is directly an IP literal
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return { isSafe: false, reason: `Private, loopback, or reserved IP address: ${hostname}` };
    }
    return { isSafe: true, resolvedIp: hostname, parsedUrl: parsed };
  }

  // 5. DNS Resolution check (prevent DNS rebinding / internal resolving)
  try {
    const lookupResult = await lookupAsync(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      return { isSafe: false, reason: `Could not resolve hostname: ${hostname}` };
    }

    for (const record of lookupResult) {
      if (isPrivateOrReservedIp(record.address)) {
        return {
          isSafe: false,
          reason: `Hostname ${hostname} resolved to forbidden private IP: ${record.address}`,
          resolvedIp: record.address,
        };
      }
    }

    return { isSafe: true, resolvedIp: lookupResult[0].address, parsedUrl: parsed };
  } catch (dnsErr: any) {
    return { isSafe: false, reason: `DNS resolution failed: ${dnsErr.message || 'unknown'}` };
  }
}
