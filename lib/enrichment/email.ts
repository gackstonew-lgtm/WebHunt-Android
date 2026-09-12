import { DiscoveredContact, ContactSource } from "./types";

// Blacklisted domain extensions that often appear in scrambled text or asset paths
const INVALID_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp", "tiff",
  "woff", "woff2", "ttf", "eot", "css", "js", "map", "json", "xml", "pdf"
]);

// Blacklisted placeholder or framework domains that are never genuine business contact addresses
const PLACEHOLDER_DOMAINS = new Set([
  "example.com", "example.org", "example.net",
  "domain.com", "yourdomain.com", "mydomain.com",
  "sample.com", "test.com", "test.org",
  "email.com", "company.com", "mysite.com",
  "sentry.io", "wixpress.com", "wordpress.com", "wordpress.org",
  "gravatar.com", "cloudflare.com", "googleapis.com",
  "schema.org", "w3.org", "github.com", "facebook.com",
  "twitter.com", "instagram.com", "linkedin.com", "youtube.com",
  "medium.com", "substack.com", "mailchimp.com", "hubspot.com"
]);

// Suspicious local parts that indicate boilerplate or templates
const PLACEHOLDER_LOCAL_PARTS = new Set([
  "yourname", "your-email", "youremail", "username", "user",
  "name", "email", "test", "demo", "sample", "placeholder",
  "someone", "first.last", "john.doe", "jane.doe"
]);

/**
 * Validates email address syntax and checks against known dummy/placeholder/asset patterns.
 */
export function isValidBusinessEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;

  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 5 || trimmed.length > 254) return false;

  // RFC 5322 simplified pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) return false;

  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;

  const [localPart, domain] = parts;
  if (!localPart || !domain) return false;

  if (PLACEHOLDER_LOCAL_PARTS.has(localPart)) return false;
  if (PLACEHOLDER_DOMAINS.has(domain)) return false;

  // Check top-level domain / extension
  const domainParts = domain.split(".");
  if (domainParts.length < 2) return false;
  const tld = domainParts[domainParts.length - 1];
  if (INVALID_EXTENSIONS.has(tld)) return false;

  // Ensure TLD has at least 2 characters and only alpha characters
  if (!/^[a-zA-Z]{2,24}$/.test(tld)) return false;

  return true;
}

/**
 * Normalizes email address by trimming, removing mailto: prefix, and converting to lowercase.
 */
export function normalizeEmail(raw: string): string | null {
  if (!raw) return null;
  let cleaned = raw.trim();
  if (cleaned.toLowerCase().startsWith("mailto:")) {
    cleaned = cleaned.substring(7);
  }
  // Strip query parameters if present (e.g. ?subject=...)
  if (cleaned.includes("?")) {
    cleaned = cleaned.split("?")[0];
  }
  cleaned = cleaned.trim().toLowerCase();
  return isValidBusinessEmail(cleaned) ? cleaned : null;
}

/**
 * Extracts and validates emails from HTML content, text, and mailto links.
 */
export function extractEmailsFromText(
  text: string, 
  source: ContactSource = "official_website", 
  sourceUrl?: string
): DiscoveredContact[] {
  if (!text) return [];

  const foundEmails = new Set<string>();
  const discovered: DiscoveredContact[] = [];

  // 1. Extract explicit mailto: links (highest confidence)
  const mailtoRegex = /mailto:([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)/gi;
  let mailtoMatch;
  while ((mailtoMatch = mailtoRegex.exec(text)) !== null) {
    const normalized = normalizeEmail(mailtoMatch[1]);
    if (normalized && !foundEmails.has(normalized)) {
      foundEmails.add(normalized);
      discovered.push({
        type: "email",
        value: normalized,
        formattedValue: normalized,
        source,
        sourceUrl: sourceUrl || null,
        verified: true,
        status: "syntax_valid",
      });
    }
  }

  // 2. Extract standard pattern matches in text body
  const bodyRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  let bodyMatch;
  while ((bodyMatch = bodyRegex.exec(text)) !== null) {
    const normalized = normalizeEmail(bodyMatch[0]);
    if (normalized && !foundEmails.has(normalized)) {
      foundEmails.add(normalized);
      discovered.push({
        type: "email",
        value: normalized,
        formattedValue: normalized,
        source,
        sourceUrl: sourceUrl || null,
        verified: true,
        status: "syntax_valid",
      });
    }
  }

  return discovered;
}
