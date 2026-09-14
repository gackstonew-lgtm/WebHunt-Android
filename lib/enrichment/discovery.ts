import { 
  PhysicalLead, 
  DiscoveredContact, 
  WebsiteStatusType, 
  WebsiteOpportunityType, 
  SocialProfiles 
} from "../types";
import { cleanBusinessName } from "../deduplication/entity-resolution";
import { fetchPublicWebsite } from "./crawler";
import { extractEmailsFromText } from "./email";
import { extractPhonesFromText, normalizePhoneNumber } from "./phone";
import { extractWhatsAppFromLinksAndTags } from "./whatsapp";
import { extractSocialsFromLinks } from "./social";
import { classifyActionLinks, detectContactForm } from "./links";
import { extractStructuredData } from "./structured-data";

export interface ContactDiscoveryResult {
  discoveredWebsiteUrl?: string | null;
  websiteStatus: WebsiteStatusType;
  websiteOpportunity: WebsiteOpportunityType;
  websiteConfidence: "High" | "Medium" | "Verified";
  contactQualityScore: number;
  recoveredPhone?: string | null;
  recoveredPhoneFormatted?: string | null;
  recoveredEmail?: string | null;
  recoveredEmails: string[];
  recoveredWhatsApp?: string | null;
  recoveredSocials: SocialProfiles;
  recoveredBookingUrl?: string | null;
  recoveredContactPageUrl?: string | null;
  hasContactForm: boolean;
  contacts: DiscoveredContact[];
}

/**
 * Calculates a standardized Contact Quality Score from 0 to 100 based on verified channels
 */
export function calculateContactQualityScore(params: {
  hasPhone: boolean;
  hasEmail: boolean;
  hasWhatsApp: boolean;
  hasOfficialWebsite: boolean;
  hasSocialProfile: boolean;
  socialProfileCount: number;
  hasBookingOrContactPage: boolean;
}): number {
  let score = 0;

  if (params.hasPhone) score += 25;
  if (params.hasEmail) score += 25;
  if (params.hasWhatsApp) score += 15;
  if (params.hasOfficialWebsite) score += 10;
  
  // Up to +15 for verified social media channels (+5 each)
  const socialBonus = Math.min(params.socialProfileCount * 5, 15);
  score += socialBonus;

  if (params.hasBookingOrContactPage) score += 10;

  return Math.min(score, 100);
}

/**
 * Validates whether a discovered domain is legitimately related to the business name
 */
export function validateDomainForBusiness(domain: string, businessName: string): boolean {
  if (!domain || !businessName) return false;

  const cleanName = cleanBusinessName(businessName);
  const nameTokens = cleanName.split(/\s+/).filter(t => t.length > 2);
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

  // Exclude common generic directories and social platforms from being considered "official website"
  const directoryDomains = [
    "facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com",
    "yellowpages.com", "yelp.com", "tripadvisor.com", "foursquare.com",
    "google.com", "bing.com", "maps.google.com", "kenyabusinessdirectory.info",
    "businesslist.co.ke", "infobel.com", "cylex.net.za"
  ];

  if (directoryDomains.some(d => cleanDomain.includes(d))) {
    return false;
  }

  // Token match with domain
  return nameTokens.some(tok => cleanDomain.includes(tok));
}

/**
 * Executes legitimate contact recovery and web presence discovery for a physical lead.
 * Does not scrape prohibited private pages or fabricate URLs.
 */
export async function recoverBusinessContacts(
  lead: PhysicalLead,
  options: { timeoutMs?: number } = {}
): Promise<ContactDiscoveryResult> {
  const timeoutMs = options.timeoutMs || 4000;
  const rawContacts: DiscoveredContact[] = [];

  let discoveredWebsite: string | null = lead.websiteUrl || null;
  let websiteStatus: WebsiteStatusType = lead.hasWebsite ? "WEBSITE_FOUND" : "NO_WEBSITE";
  let websiteOpportunity: WebsiteOpportunityType = "NO_WEBSITE";
  let websiteConfidence: "High" | "Medium" | "Verified" = "Verified";

  const recoveredSocials: SocialProfiles = { ...(lead.socialProfiles || {}) };
  let recoveredPhone: string | null = (lead.phone && lead.phoneFormatted !== "Phone unavailable") ? lead.phone : null;
  let recoveredPhoneFormatted: string | null = lead.phoneFormatted !== "Phone unavailable" ? lead.phoneFormatted : null;
  let recoveredEmail: string | null = lead.email || null;
  const recoveredEmails: string[] = lead.emails ? [...lead.emails] : (lead.email ? [lead.email] : []);
  let recoveredWhatsApp: string | null = lead.whatsapp || null;
  let recoveredBookingUrl: string | null = lead.bookingUrl || null;
  let recoveredContactPageUrl: string | null = lead.contactPageUrl || null;
  let hasContactForm = lead.hasContactForm || false;

  // 1. If lead already has a website on record, probe it for reachability and enrichment
  if (discoveredWebsite) {
    try {
      const crawlRes = await fetchPublicWebsite(discoveredWebsite, timeoutMs);
      if (crawlRes) {
        websiteStatus = "WEBSITE_FOUND";
        websiteOpportunity = "STRONG_WEB_PRESENCE";

        const { html, links, finalUrl } = crawlRes;

        // Structured data extraction
        const structured = extractStructuredData(html, finalUrl, lead.country);
        rawContacts.push(...structured.phones, ...structured.emails, ...structured.socials);

        // Emails
        const emails = extractEmailsFromText(html, "official_website", finalUrl);
        rawContacts.push(...emails);
        emails.forEach(e => {
          if (!recoveredEmails.includes(e.value)) recoveredEmails.push(e.value);
        });
        if (!recoveredEmail && recoveredEmails.length > 0) recoveredEmail = recoveredEmails[0];

        // Phones
        const phones = extractPhonesFromText(html, lead.country, "official_website", finalUrl);
        rawContacts.push(...phones);
        if (!recoveredPhone && phones.length > 0) {
          recoveredPhone = phones[0].value;
          recoveredPhoneFormatted = phones[0].formattedValue || phones[0].value;
        }

        // WhatsApp
        const hrefs = links.map(l => l.href);
        const waContacts = extractWhatsAppFromLinksAndTags(hrefs, [], lead.country, "official_website", finalUrl);
        rawContacts.push(...waContacts);
        if (!recoveredWhatsApp && waContacts.length > 0) {
          recoveredWhatsApp = waContacts[0].value;
        }

        // Social Profiles
        const { discovered: socials } = extractSocialsFromLinks(hrefs, "official_website", finalUrl);
        rawContacts.push(...socials);
        for (const s of socials) {
          if (s.platform && s.platform !== "other" && !recoveredSocials[s.platform]) {
            recoveredSocials[s.platform] = s.value;
          }
        }

        // Action pages
        const classified = classifyActionLinks(links, finalUrl, "official_website", finalUrl);
        rawContacts.push(...classified.contactPages, ...classified.bookingPages);
        if (!recoveredContactPageUrl && classified.contactPages.length > 0) {
          recoveredContactPageUrl = classified.contactPages[0].value;
        }
        if (!recoveredBookingUrl && classified.bookingPages.length > 0) {
          recoveredBookingUrl = classified.bookingPages[0].value;
        }

        hasContactForm = detectContactForm(html);
      } else {
        websiteStatus = "BROKEN_WEBSITE";
        websiteOpportunity = "BROKEN_WEBSITE";
      }
    } catch {
      websiteStatus = "BROKEN_WEBSITE";
      websiteOpportunity = "BROKEN_WEBSITE";
    }
  } else {
    // 2. Business has NO website listed originally. Check if only social profiles exist.
    const socialCount = Object.values(recoveredSocials).filter(Boolean).length;
    if (socialCount > 0) {
      websiteStatus = "SOCIAL_ONLY";
      websiteOpportunity = "SOCIAL_ONLY";
    } else {
      websiteStatus = "NO_WEBSITE";
      websiteOpportunity = "NO_WEBSITE";
    }
  }

  // 3. Contact Quality Score calculation
  const hasPhone = Boolean(recoveredPhone && recoveredPhoneFormatted !== "Phone unavailable");
  const hasEmail = Boolean(recoveredEmail || recoveredEmails.length > 0);
  const hasWhatsApp = Boolean(recoveredWhatsApp);
  const hasOfficialWebsite = websiteStatus === "WEBSITE_FOUND";
  const socialProfileCount = Object.values(recoveredSocials).filter(Boolean).length;
  const hasBookingOrContact = Boolean(recoveredBookingUrl || recoveredContactPageUrl || hasContactForm);

  const contactQualityScore = calculateContactQualityScore({
    hasPhone,
    hasEmail,
    hasWhatsApp,
    hasOfficialWebsite,
    hasSocialProfile: socialProfileCount > 0,
    socialProfileCount,
    hasBookingOrContactPage: hasBookingOrContact,
  });

  return {
    discoveredWebsiteUrl: discoveredWebsite,
    websiteStatus,
    websiteOpportunity,
    websiteConfidence,
    contactQualityScore,
    recoveredPhone,
    recoveredPhoneFormatted,
    recoveredEmail,
    recoveredEmails,
    recoveredWhatsApp,
    recoveredSocials,
    recoveredBookingUrl,
    recoveredContactPageUrl,
    hasContactForm,
    contacts: rawContacts,
  };
}
