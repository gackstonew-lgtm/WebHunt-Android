import { DiscoveredContact, SocialPlatform, SocialProfiles, ContactSource } from "./types";

function isPathIgnored(pathname: string, ignored: string[]): boolean {
  const lower = pathname.toLowerCase();
  if (lower === "" || lower === "/") return true;
  return ignored.some(p => lower === p || lower.startsWith(`${p}/`) || lower.startsWith(`${p}?`));
}

/**
 * Normalizes a raw social URL, strips tracking parameters, and checks if it's a valid business profile.
 */
export function normalizeSocialUrl(url: string): {
  platform: SocialPlatform;
  canonicalUrl: string;
  handle: string;
} | null {
  if (!url || typeof url !== "string") return null;

  let cleaned = url.trim();
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    cleaned = `https://${cleaned}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch (e) {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  let pathname = parsed.pathname;

  // Clean trailing slash
  if (pathname.endsWith("/") && pathname.length > 1) {
    pathname = pathname.slice(0, -1);
  }

  // 1. Facebook
  if (hostname === "facebook.com" || hostname === "fb.com" || hostname === "m.facebook.com") {
    const ignoredPaths = [
      "/sharer", "/sharer.php", "/share.php", "/plugins",
      "/pages/create", "/tr", "/dialog", "/events", "/hashtag", "/login",
      "/recover", "/help", "/policies"
    ];
    if (isPathIgnored(pathname, ignoredPaths)) return null;

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const handle = segments[0];
    return {
      platform: "facebook",
      canonicalUrl: `https://www.facebook.com/${handle}`,
      handle,
    };
  }

  // 2. Instagram
  if (hostname === "instagram.com" || hostname === "instagr.am") {
    const ignoredPaths = [
      "/p", "/explore", "/stories", "/reel", "/reels",
      "/developer", "/about", "/legal", "/accounts", "/direct"
    ];
    if (isPathIgnored(pathname, ignoredPaths)) return null;

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const handle = segments[0];
    return {
      platform: "instagram",
      canonicalUrl: `https://www.instagram.com/${handle}`,
      handle,
    };
  }

  // 3. LinkedIn
  if (hostname === "linkedin.com" || hostname === "ke.linkedin.com" || hostname === "uk.linkedin.com") {
    const ignoredPaths = [
      "/sharearticle", "/sharing", "/pulse", "/feed",
      "/login", "/signup", "/legal", "/jobs"
    ];
    if (isPathIgnored(pathname, ignoredPaths)) return null;

    if (pathname.startsWith("/company/") || pathname.startsWith("/in/") || pathname.startsWith("/school/")) {
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length >= 2) {
        const handle = segments[1];
        return {
          platform: "linkedin",
          canonicalUrl: `https://www.linkedin.com/${segments[0]}/${handle}`,
          handle,
        };
      }
    }
  }

  // 4. X / Twitter
  if (hostname === "twitter.com" || hostname === "x.com") {
    const ignoredPaths = [
      "/intent", "/share", "/home", "/explore", "/search",
      "/i", "/login", "/signup", "/tos", "/privacy"
    ];
    if (isPathIgnored(pathname, ignoredPaths)) return null;

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const handle = segments[0].replace(/^@/, "");
    return {
      platform: "twitter",
      canonicalUrl: `https://x.com/${handle}`,
      handle,
    };
  }

  // 5. YouTube
  if (hostname === "youtube.com" || hostname === "youtu.be") {
    const ignoredPaths = [
      "/watch", "/embed", "/shorts", "/feed", "/results", "/live"
    ];
    if (isPathIgnored(pathname, ignoredPaths)) return null;

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const handle = segments.join("/");
      return {
        platform: "youtube",
        canonicalUrl: `https://www.youtube.com/${handle}`,
        handle: segments[segments.length - 1],
      };
    }
  }

  // 6. TikTok
  if (hostname === "tiktok.com") {
    const ignoredPaths = ["/tag", "/music", "/embed", "/discover"];
    if (isPathIgnored(pathname, ignoredPaths)) return null;

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && segments[0].startsWith("@")) {
      return {
        platform: "tiktok",
        canonicalUrl: `https://www.tiktok.com/${segments[0]}`,
        handle: segments[0].substring(1),
      };
    }
  }

  // 7. Telegram
  if (hostname === "t.me" || hostname === "telegram.me") {
    const ignoredPaths = ["/share", "/joinchat", "/addstickers", "/setlanguage"];
    if (isPathIgnored(pathname, ignoredPaths)) return null;

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const handle = segments[0];
      return {
        platform: "telegram",
        canonicalUrl: `https://t.me/${handle}`,
        handle,
      };
    }
  }

  return null;
}

/**
 * Extracts and categorizes social profile links from an array of URL strings.
 */
export function extractSocialsFromLinks(
  links: string[],
  source: ContactSource = "official_website",
  sourceUrl?: string
): {
  discovered: DiscoveredContact[];
  profiles: SocialProfiles;
} {
  const discovered: DiscoveredContact[] = [];
  const profiles: SocialProfiles = {};
  const seenUrls = new Set<string>();

  for (const rawUrl of links) {
    if (!rawUrl || typeof rawUrl !== "string") continue;

    const normalized = normalizeSocialUrl(rawUrl);
    if (!normalized) continue;

    if (!seenUrls.has(normalized.canonicalUrl)) {
      seenUrls.add(normalized.canonicalUrl);

      discovered.push({
        type: "social",
        value: normalized.canonicalUrl,
        formattedValue: `@${normalized.handle}`,
        platform: normalized.platform,
        label: `${normalized.platform.toUpperCase()} Profile`,
        source,
        sourceUrl: sourceUrl || null,
        verified: true,
        status: "source_verified",
      });

      // Populate specific social profile slot if not already set
      if (!profiles[normalized.platform]) {
        profiles[normalized.platform] = normalized.canonicalUrl;
      }
    }
  }

  return { discovered, profiles };
}
