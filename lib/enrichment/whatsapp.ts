import { DiscoveredContact, ContactSource } from "./types";
import { normalizePhoneNumber } from "./phone";

/**
 * Extracts verified WhatsApp contact channels from explicit WhatsApp links or tags.
 * NOTE: NEVER assumes a regular phone is WhatsApp without explicit evidence.
 */
export function extractWhatsAppFromLinksAndTags(
  links: string[],
  tagValues?: string[],
  country?: string,
  source: ContactSource = "official_website",
  sourceUrl?: string
): DiscoveredContact[] {
  const discovered: DiscoveredContact[] = [];
  const seenNumbers = new Set<string>();

  // 1. Process explicit WhatsApp URLs
  for (const link of links) {
    if (!link || typeof link !== "string") continue;
    const trimmed = link.trim();

    let rawPhone: string | null = null;

    // Pattern: https://wa.me/254700123456 or wa.me/254...
    const waMeMatch = trimmed.match(/(?:https?:\/\/)?wa\.me\/([+0-9]+)/i);
    if (waMeMatch) {
      rawPhone = waMeMatch[1];
    }

    // Pattern: api.whatsapp.com/send?phone=254...
    const apiMatch = trimmed.match(/api\.whatsapp\.com\/send\?(?:.*&)?phone=([+0-9]+)/i);
    if (apiMatch) {
      rawPhone = apiMatch[1];
    }

    // Pattern: whatsapp://send?phone=254...
    const schemeMatch = trimmed.match(/whatsapp:\/\/send\?(?:.*&)?phone=([+0-9]+)/i);
    if (schemeMatch) {
      rawPhone = schemeMatch[1];
    }

    if (rawPhone) {
      const digitsOnly = rawPhone.replace(/\D/g, "");
      if (digitsOnly.length >= 7) {
        const phoneValidation = normalizePhoneNumber(`+${digitsOnly}`, country);
        const cleanDigits = phoneValidation.normalized ? phoneValidation.normalized.replace(/\D/g, "") : digitsOnly;
        
        if (!seenNumbers.has(cleanDigits)) {
          seenNumbers.add(cleanDigits);
          discovered.push({
            type: "whatsapp",
            value: `https://wa.me/${cleanDigits}`,
            formattedValue: phoneValidation.formatted !== "Phone unavailable" ? phoneValidation.formatted : `+${cleanDigits}`,
            label: "WhatsApp Business Direct",
            source,
            sourceUrl: sourceUrl || null,
            verified: true,
            status: "source_verified",
          });
        }
      }
    }
  }

  // 2. Process explicit OSM / metadata WhatsApp tags
  if (tagValues && Array.isArray(tagValues)) {
    for (const tag of tagValues) {
      if (!tag || typeof tag !== "string") continue;
      const digitsOnly = tag.replace(/\D/g, "");
      if (digitsOnly.length >= 7) {
        const phoneValidation = normalizePhoneNumber(`+${digitsOnly}`, country);
        const cleanDigits = phoneValidation.normalized ? phoneValidation.normalized.replace(/\D/g, "") : digitsOnly;

        if (!seenNumbers.has(cleanDigits)) {
          seenNumbers.add(cleanDigits);
          discovered.push({
            type: "whatsapp",
            value: `https://wa.me/${cleanDigits}`,
            formattedValue: phoneValidation.formatted !== "Phone unavailable" ? phoneValidation.formatted : `+${cleanDigits}`,
            label: "WhatsApp Business Contact",
            source: "osm_tag",
            sourceUrl: sourceUrl || null,
            verified: true,
            status: "source_verified",
          });
        }
      }
    }
  }

  return discovered;
}
