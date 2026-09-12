import { validateUrlForSsrf } from "../security/ssrf";

export interface CrawlResult {
  html: string;
  links: Array<{ href: string; text?: string }>;
  finalUrl: string;
}

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 600000; // 600KB cap

/**
 * Fetches public HTML content from a given business URL with strict SSRF validation and safe redirect tracking.
 */
export async function fetchPublicWebsite(
  rawUrl: string, 
  timeoutMs = 3500
): Promise<CrawlResult | null> {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  let currentUrl = rawUrl.trim();
  if (!currentUrl.startsWith("http://") && !currentUrl.startsWith("https://")) {
    currentUrl = `https://${currentUrl}`;
  }

  let redirectCount = 0;

  try {
    while (redirectCount <= MAX_REDIRECTS) {
      // 1. SSRF Check on current URL
      const ssrfCheck = await validateUrlForSsrf(currentUrl);
      if (!ssrfCheck.isSafe) {
        console.warn(`[Crawler] SSRF protection blocked target URL: ${currentUrl} (${ssrfCheck.reason})`);
        return null;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(currentUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; WebHunt-LeadEnrichment/2.0; +https://webhunt.app)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
        redirect: "manual", // Prevent automatic unsafe redirects
      });

      clearTimeout(timeoutId);

      // Handle HTTP redirects safely (301, 302, 303, 307, 308)
      if (response.status >= 300 && response.status < 400) {
        const locationHeader = response.headers.get("location");
        if (!locationHeader) return null;

        const nextUrl = new URL(locationHeader, currentUrl).toString();
        currentUrl = nextUrl;
        redirectCount++;
        continue;
      }

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("text/html") && !contentType.toLowerCase().includes("xhtml")) {
        return null;
      }

      // Read response text (cap at 600KB for speed and memory efficiency)
      const text = await response.text();
      const cappedHtml = text.slice(0, MAX_RESPONSE_BYTES);

      // Extract all <a href="..."> links
      const links: Array<{ href: string; text?: string }> = [];
      const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;

      while ((match = linkRegex.exec(cappedHtml)) !== null) {
        const href = match[1].trim();
        const rawText = match[2].replace(/<[^>]+>/g, "").trim();
        if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
          links.push({ href, text: rawText });
        }
      }

      return {
        html: cappedHtml,
        links,
        finalUrl: currentUrl,
      };
    }

    return null;
  } catch (error) {
    // Network errors, timeouts, or DNS failures are non-fatal
    return null;
  }
}
