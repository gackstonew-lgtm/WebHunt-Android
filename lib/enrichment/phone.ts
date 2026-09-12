import { DiscoveredContact, ContactSource } from "./types";
import { validateAndFormatPhone } from "../validation/phone";

/**
 * Normalizes a raw phone string into canonical E.164 and human-readable format.
 */
export function normalizePhoneNumber(raw: string, country?: string): {
  normalized: string | null;
  formatted: string;
  isValid: boolean;
} {
  if (!raw || typeof raw !== "string") {
    return { normalized: null, formatted: "Phone unavailable", isValid: false };
  }

  let cleaned = raw.trim();
  if (cleaned.toLowerCase().startsWith("tel:")) {
    cleaned = cleaned.substring(4);
  }

  const res = validateAndFormatPhone(cleaned, country || "Kenya");
  const normDigits = res.normalized ? (res.normalized.startsWith("+") ? res.normalized : `+${res.normalized}`) : null;
  return {
    normalized: normDigits,
    formatted: res.formatted,
    isValid: res.isValid,
  };
}

/**
 * Extracts phone numbers from text and tel: links.
 */
export function extractPhonesFromText(
  text: string, 
  country?: string, 
  source: ContactSource = "official_website",
  sourceUrl?: string
): DiscoveredContact[] {
  if (!text) return [];

  const seenNormalized = new Set<string>();
  const discovered: DiscoveredContact[] = [];

  // 1. Extract tel: links
  const telRegex = /tel:([+0-9\s().-]{7,25})/gi;
  let telMatch;
  while ((telMatch = telRegex.exec(text)) !== null) {
    const rawNum = telMatch[1];
    const validation = normalizePhoneNumber(rawNum, country);
    if (validation.isValid && validation.normalized && !seenNormalized.has(validation.normalized)) {
      seenNormalized.add(validation.normalized);
      discovered.push({
        type: "phone",
        value: validation.normalized,
        formattedValue: validation.formatted,
        source,
        sourceUrl: sourceUrl || null,
        verified: true,
        status: "source_verified",
      });
    }
  }

  // 2. Extract telephone strings from text matching international formats
  const phonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
  let phoneMatch;
  while ((phoneMatch = phonePattern.exec(text)) !== null) {
    const rawNum = phoneMatch[0];
    const validation = normalizePhoneNumber(rawNum, country);
    if (validation.isValid && validation.normalized && !seenNormalized.has(validation.normalized)) {
      seenNormalized.add(validation.normalized);
      discovered.push({
        type: "phone",
        value: validation.normalized,
        formattedValue: validation.formatted,
        source,
        sourceUrl: sourceUrl || null,
        verified: true,
        status: "source_verified",
      });
    }
  }

  return discovered;
}

/**
 * Deduplicates contacts list across types and normalized values.
 */
export function deduplicateContacts(contacts: DiscoveredContact[]): DiscoveredContact[] {
  const seen = new Set<string>();
  const result: DiscoveredContact[] = [];

  for (const c of contacts) {
    const key = `${c.type}:${c.platform || ""}:${(c.value || "").toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }

  return result;
}
