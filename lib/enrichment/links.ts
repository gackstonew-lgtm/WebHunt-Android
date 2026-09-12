import { DiscoveredContact, ContactSource } from "./types";

const BOOKING_DOMAINS = [
  "calendly.com",
  "acuityscheduling.com",
  "setmore.com",
  "squareup.com/appointments",
  "fresha.com",
  "opentable.com",
  "resy.com",
  "mindbodyonline.com",
  "vagaro.com",
  "schedulicity.com",
  "timify.com",
  "appointlet.com",
  "simplybook.me",
  "booksy.com",
];

const CONTACT_PATH_KEYWORDS = [
  "contact",
  "contact-us",
  "contactus",
  "get-in-touch",
  "reach-us",
  "about-us",
  "about",
  "support",
  "help",
  "locations",
];

const BOOKING_PATH_KEYWORDS = [
  "book",
  "booking",
  "book-now",
  "book-online",
  "appointment",
  "appointments",
  "schedule",
  "reservation",
  "reserve",
  "quote",
  "request-quote",
  "consultation",
];

/**
 * Resolves a potentially relative URL against the base website URL.
 */
export function resolveUrl(href: string, baseUrl: string): string | null {
  if (!href || typeof href !== "string") return null;
  const trimmed = href.trim();
  if (trimmed.startsWith("#") || trimmed.startsWith("javascript:") || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
    return null;
  }

  try {
    const resolved = new URL(trimmed, baseUrl);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    return resolved.toString();
  } catch (e) {
    return null;
  }
}

/**
 * Classifies extracted links from a website into Contact Pages and Booking URLs.
 */
export function classifyActionLinks(
  rawLinks: Array<{ href: string; text?: string }>,
  baseUrl: string,
  source: ContactSource = "official_website",
  sourceUrl?: string
): {
  contactPages: DiscoveredContact[];
  bookingPages: DiscoveredContact[];
} {
  const contactPages: DiscoveredContact[] = [];
  const bookingPages: DiscoveredContact[] = [];

  const seenContactUrls = new Set<string>();
  const seenBookingUrls = new Set<string>();

  for (const item of rawLinks) {
    const fullUrl = resolveUrl(item.href, baseUrl);
    if (!fullUrl) continue;

    const lowerUrl = fullUrl.toLowerCase();
    const lowerText = (item.text || "").toLowerCase().trim();

    // 1. Check if URL matches third-party booking tools or booking keywords
    const isThirdPartyBooking = BOOKING_DOMAINS.some(d => lowerUrl.includes(d));
    const isPathBooking = BOOKING_PATH_KEYWORDS.some(k => {
      const regex = new RegExp(`[/_-]${k}(?:[/._-]|$)`, "i");
      return regex.test(lowerUrl) || lowerText.includes(k);
    });

    if (isThirdPartyBooking || isPathBooking) {
      if (!seenBookingUrls.has(fullUrl)) {
        seenBookingUrls.add(fullUrl);
        bookingPages.push({
          type: "booking_page",
          value: fullUrl,
          label: lowerText ? `Book (${item.text})` : "Schedule / Booking Page",
          source,
          sourceUrl: sourceUrl || null,
          verified: true,
          status: "source_verified",
        });
      }
      continue;
    }

    // 2. Check if URL matches contact pages
    const isContactPath = CONTACT_PATH_KEYWORDS.some(k => {
      const regex = new RegExp(`[/_-]${k}(?:[/._-]|$)`, "i");
      return regex.test(lowerUrl) || lowerText.includes(k);
    });

    if (isContactPath) {
      if (!seenContactUrls.has(fullUrl)) {
        seenContactUrls.add(fullUrl);
        contactPages.push({
          type: "contact_page",
          value: fullUrl,
          label: lowerText ? `Contact (${item.text})` : "Contact Page",
          source,
          sourceUrl: sourceUrl || null,
          verified: true,
          status: "source_verified",
        });
      }
    }
  }

  return { contactPages, bookingPages };
}

/**
 * Checks whether an HTML string contains a public contact form.
 */
export function detectContactForm(html: string): boolean {
  if (!html) return false;
  const lower = html.toLowerCase();
  if (!lower.includes("<form")) return false;

  // Look for form with inputs related to contact or submission
  const hasInputs = lower.includes('type="email"') || 
                    lower.includes('name="email"') || 
                    lower.includes('name="message"') || 
                    lower.includes("<textarea") ||
                    lower.includes('name="phone"') ||
                    lower.includes('contact');

  const hasSubmit = lower.includes('type="submit"') || lower.includes("<button");

  return hasInputs && hasSubmit;
}
