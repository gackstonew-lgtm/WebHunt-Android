import { validateAndFormatPhone } from "../validation/phone";

/**
 * Generates a clean, validated direct WhatsApp Click-to-Chat URL (Tier A).
 * Automatically cleans and formats phone numbers to strict international E.164 digits.
 */
export function generateWhatsAppChatLink(
  rawPhone: string,
  message?: string,
  countryHint: string = "KE"
): { url: string; formattedPhone: string; isValid: boolean } {
  if (!rawPhone || rawPhone.trim() === "") {
    return { url: "", formattedPhone: "", isValid: false };
  }

  // Use the validated phone normalizer
  const validated = validateAndFormatPhone(rawPhone, countryHint);
  
  // Extract pure numeric digits without '+' for wa.me URL
  let cleanDigits = validated.normalized.replace(/\D/g, "");

  // If phone was empty or unparseable, strip non-digits from raw input
  if (!cleanDigits) {
    cleanDigits = rawPhone.replace(/\D/g, "");
    if (cleanDigits.startsWith("0") && (countryHint === "KE" || countryHint === "Kenya")) {
      cleanDigits = "254" + cleanDigits.slice(1);
    }
  }

  if (cleanDigits.length < 8) {
    return { url: "", formattedPhone: rawPhone, isValid: false };
  }

  let finalUrl = `https://wa.me/${cleanDigits}`;
  if (message && message.trim() !== "") {
    finalUrl += `?text=${encodeURIComponent(message.trim())}`;
  }

  return {
    url: finalUrl,
    formattedPhone: validated.formatted || `+${cleanDigits}`,
    isValid: true,
  };
}

/**
 * Creates a standard quick WhatsApp cold pitch for a local business lead
 */
export function createQuickWhatsAppLeadMessage(params: {
  businessName: string;
  category?: string | null;
  city?: string | null;
  senderName: string;
}): string {
  const { businessName, category, city, senderName } = params;
  const niche = category || "services";
  const c = (city || "").trim();
  const lower = c.toLowerCase();
  const isGeneric = !c || lower.includes("worldwide") || lower.includes("global") || lower.includes("remote") || lower.includes("anywhere");
  const location = isGeneric ? "" : ` in ${c}`;

  return `Hello ${businessName} team! 👋 My name is ${senderName}. I came across your business listing${location} and wanted to ask if you currently take customer inquiries or bookings directly online?

I build clean, high-speed mobile pages with direct 1-click WhatsApp ordering and booking for ${niche} businesses to convert search traffic into direct customers.

I put together a quick mockup preview showing what a modern mobile site for ${businessName} could look like. Would you be open to me sharing the link here?`;
}
