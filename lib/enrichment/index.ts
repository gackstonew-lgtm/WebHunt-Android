import { 
  DiscoveredContact, 
  EnrichedLeadContacts, 
  SocialProfiles, 
  PhysicalLead, 
  OnlineJobLead, 
  LeadItem 
} from "../types";
import { extractEmailsFromText } from "./email";
import { extractPhonesFromText, deduplicateContacts, normalizePhoneNumber } from "./phone";
import { extractWhatsAppFromLinksAndTags } from "./whatsapp";
import { extractSocialsFromLinks } from "./social";
import { classifyActionLinks, detectContactForm } from "./links";
import { extractStructuredData } from "./structured-data";
import { fetchPublicWebsite } from "./crawler";
import { EnrichmentOptions } from "./types";

// In-memory enrichment cache keyed by URL/Domain to avoid redundant crawling
const enrichmentCache = new Map<string, { data: EnrichedLeadContacts; expiresAt: number }>();

/**
 * Extracts all legitimate contact channels for a single lead.
 */
export async function enrichLeadContacts(
  lead: PhysicalLead | OnlineJobLead,
  options: EnrichmentOptions = {}
): Promise<EnrichedLeadContacts> {
  const isPhysical = lead.type === "physical";
  const pLead = isPhysical ? (lead as PhysicalLead) : null;
  const jLead = !isPhysical ? (lead as OnlineJobLead) : null;

  const country = isPhysical ? pLead!.country : (jLead!.country || "Worldwide");
  const websiteUrl = isPhysical ? pLead!.websiteUrl : jLead!.url;

  // Check in-memory cache if website exists
  if (websiteUrl && !options.forceRefresh) {
    const cacheKey = websiteUrl.toLowerCase().trim();
    const cached = enrichmentCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  const rawPhones: DiscoveredContact[] = [];
  const rawEmails: DiscoveredContact[] = [];
  const rawWhatsApp: DiscoveredContact[] = [];
  const rawSocials: DiscoveredContact[] = [];
  const rawContactPages: DiscoveredContact[] = [];
  const rawBookingPages: DiscoveredContact[] = [];
  let hasContactForm = false;

  // -------------------------------------------------------------
  // 1. PROVIDER & OSM METADATA EXTRACTION
  // -------------------------------------------------------------
  if (isPhysical && pLead) {
    // Primary phone from provider
    if (pLead.phone) {
      const phoneVal = normalizePhoneNumber(pLead.phone, country);
      if (phoneVal.isValid && phoneVal.normalized) {
        rawPhones.push({
          type: "phone",
          value: phoneVal.normalized,
          formattedValue: pLead.phoneFormatted || phoneVal.formatted,
          label: "Primary Phone",
          source: (pLead.sourceProvider === "osm" ? "osm_tag" : "provider_api") as any,
          sourceUrl: pLead.sourceUrl || null,
          verified: true,
          status: "source_verified",
        });
      }
    }

    // Existing direct fields if provider supplied email or whatsapp
    if (pLead.email) {
      const emailContacts = extractEmailsFromText(pLead.email, "provider_api", pLead.sourceUrl || undefined);
      rawEmails.push(...emailContacts);
    }
    if (pLead.whatsapp) {
      const waContacts = extractWhatsAppFromLinksAndTags([pLead.whatsapp], [pLead.whatsapp], country, "provider_api", pLead.sourceUrl || undefined);
      rawWhatsApp.push(...waContacts);
    }
    if (pLead.socialProfiles) {
      const socialUrls = Object.values(pLead.socialProfiles).filter((u): u is string => Boolean(u));
      const { discovered } = extractSocialsFromLinks(socialUrls, "provider_api", pLead.sourceUrl || undefined);
      rawSocials.push(...discovered);
    }
  }

  // -------------------------------------------------------------
  // 2. PUBLIC WEBSITE & STRUCTURED DATA EXTRACTION (If Website Exists)
  // -------------------------------------------------------------
  if (websiteUrl && !options.skipCrawl) {
    const crawlResult = await fetchPublicWebsite(websiteUrl, options.timeoutMs || 3500);

    if (crawlResult) {
      const { html, links, finalUrl } = crawlResult;

      // A. Schema.org JSON-LD Structured Data
      const structured = extractStructuredData(html, finalUrl, country);
      rawPhones.push(...structured.phones);
      rawEmails.push(...structured.emails);
      rawSocials.push(...structured.socials);

      // B. Public mailto & text emails
      const webEmails = extractEmailsFromText(html, "official_website", finalUrl);
      rawEmails.push(...webEmails);

      // C. Public tel & text phones
      const webPhones = extractPhonesFromText(html, country, "official_website", finalUrl);
      rawPhones.push(...webPhones);

      // D. WhatsApp URLs in links and text
      const allHrefStrings = links.map(l => l.href);
      const waContacts = extractWhatsAppFromLinksAndTags(allHrefStrings, [], country, "official_website", finalUrl);
      rawWhatsApp.push(...waContacts);

      // E. Social profiles in links
      const { discovered: webSocials } = extractSocialsFromLinks(allHrefStrings, "official_website", finalUrl);
      rawSocials.push(...webSocials);

      // F. Action URLs (Contact pages & Booking pages)
      const classified = classifyActionLinks(links, finalUrl, "official_website", finalUrl);
      rawContactPages.push(...classified.contactPages);
      rawBookingPages.push(...classified.bookingPages);

      // G. Contact Form Detection
      hasContactForm = detectContactForm(html);
    }
  }

  // -------------------------------------------------------------
  // 3. DEDUPLICATION & CONSOLIDATION
  // -------------------------------------------------------------
  const phones = deduplicateContacts(rawPhones);
  const emails = deduplicateContacts(rawEmails);
  const whatsapp = deduplicateContacts(rawWhatsApp);
  const socials = deduplicateContacts(rawSocials);
  const contactPages = deduplicateContacts(rawContactPages);
  const bookingPages = deduplicateContacts(rawBookingPages);

  // Extract structured SocialProfiles map
  const socialProfiles: SocialProfiles = {};
  for (const s of socials) {
    if (s.platform && s.platform !== "other" && !socialProfiles[s.platform]) {
      socialProfiles[s.platform] = s.value;
    }
  }

  const primaryPhone = phones[0]?.value || (isPhysical ? pLead!.phone : "");
  const primaryPhoneFormatted = phones[0]?.formattedValue || (isPhysical ? pLead!.phoneFormatted : "");
  const primaryEmail = emails[0]?.value || null;
  const primaryWhatsApp = whatsapp[0]?.value || null;
  const primaryContactPage = contactPages[0]?.value || null;
  const primaryBookingPage = bookingPages[0]?.value || null;

  const enriched: EnrichedLeadContacts = {
    phones,
    emails,
    whatsapp,
    socials,
    contactPages,
    bookingPages,
    primaryPhone,
    primaryPhoneFormatted,
    primaryEmail,
    primaryWhatsApp,
    primaryContactPage,
    primaryBookingPage,
    hasContactForm,
    socialProfiles,
    lastEnrichedAt: new Date(),
  };

  // Cache result for 24 hours
  if (websiteUrl) {
    const cacheKey = websiteUrl.toLowerCase().trim();
    enrichmentCache.set(cacheKey, { data: enriched, expiresAt: Date.now() + 24 * 3600 * 1000 });
  }

  return enriched;
}

/**
 * Enriches an array of leads concurrently with non-blocking Promise.allSettled.
 */
export async function enrichLeadsBatch(
  leads: LeadItem[],
  options: EnrichmentOptions = {}
): Promise<LeadItem[]> {
  if (!leads || leads.length === 0) return [];

  const enrichedPromises = leads.map(async (lead) => {
    try {
      const enrichment = await enrichLeadContacts(lead, options);

      const allContacts: DiscoveredContact[] = [
        ...enrichment.phones,
        ...enrichment.emails,
        ...enrichment.whatsapp,
        ...enrichment.socials,
        ...enrichment.contactPages,
        ...enrichment.bookingPages,
      ];

      return {
        ...lead,
        email: enrichment.primaryEmail,
        emails: enrichment.emails.map(e => e.value),
        whatsapp: enrichment.primaryWhatsApp,
        contactPageUrl: enrichment.primaryContactPage,
        bookingUrl: enrichment.primaryBookingPage,
        hasContactForm: enrichment.hasContactForm,
        socialProfiles: enrichment.socialProfiles,
        contacts: allContacts,
        enrichment,
      };
    } catch (err) {
      console.warn(`[Enrichment] Non-fatal enrichment error on lead ${lead.id}:`, err);
      return lead;
    }
  });

  const settled = await Promise.allSettled(enrichedPromises);
  return settled.map((res, idx) => {
    if (res.status === "fulfilled") {
      return res.value;
    }
    return leads[idx];
  });
}
