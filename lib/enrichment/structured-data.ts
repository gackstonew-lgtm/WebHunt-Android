import { DiscoveredContact, ContactSource } from "./types";
import { normalizeEmail } from "./email";
import { normalizePhoneNumber } from "./phone";
import { extractSocialsFromLinks } from "./social";

/**
 * Parses and extracts business contact information from JSON-LD Schema.org scripts.
 */
export function extractStructuredData(
  html: string, 
  baseUrl: string, 
  country?: string
): {
  phones: DiscoveredContact[];
  emails: DiscoveredContact[];
  socials: DiscoveredContact[];
  website?: string;
  businessName?: string;
} {
  const phones: DiscoveredContact[] = [];
  const emails: DiscoveredContact[] = [];
  const allSameAsLinks: string[] = [];
  let detectedWebsite: string | undefined;
  let detectedName: string | undefined;

  if (!html) {
    return { phones, emails, socials: [] };
  }

  // Find all <script type="application/ld+json"> tags
  const scriptRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;

  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    const rawJson = scriptMatch[1].trim();
    if (!rawJson) continue;

    try {
      const data = JSON.parse(rawJson);
      processJsonLdItem(data);
    } catch (e) {
      // Ignore invalid JSON in script tags
    }
  }

  function processJsonLdItem(item: any) {
    if (!item) return;

    if (Array.isArray(item)) {
      item.forEach(processJsonLdItem);
      return;
    }

    if (typeof item === "object") {
      // Check for @graph
      if (Array.isArray(item["@graph"])) {
        item["@graph"].forEach(processJsonLdItem);
        return;
      }

      const type = item["@type"];
      if (!type) return;

      const typeStr = Array.isArray(type) ? type.join(" ") : String(type);
      const isBusinessOrOrg = /LocalBusiness|Organization|ProfessionalService|Store|Restaurant|Dentist|MedicalBusiness|AutoRepair|Plumber|HomeAndConstructionBusiness|HealthAndBeautyBusiness|Corporation/i.test(typeStr);

      if (isBusinessOrOrg) {
        if (item.name && !detectedName) {
          detectedName = String(item.name);
        }
        if (item.url && !detectedWebsite) {
          detectedWebsite = String(item.url);
        }

        // 1. Telephone
        if (item.telephone) {
          const rawTel = String(item.telephone);
          const validation = normalizePhoneNumber(rawTel, country);
          if (validation.isValid && validation.normalized) {
            phones.push({
              type: "phone",
              value: validation.normalized,
              formattedValue: validation.formatted,
              source: "structured_data",
              sourceUrl: baseUrl,
              verified: true,
              status: "source_verified",
            });
          }
        }

        // 2. Email
        if (item.email) {
          const normalized = normalizeEmail(String(item.email));
          if (normalized) {
            emails.push({
              type: "email",
              value: normalized,
              formattedValue: normalized,
              source: "structured_data",
              sourceUrl: baseUrl,
              verified: true,
              status: "syntax_valid",
            });
          }
        }

        // 3. sameAs social profiles
        if (item.sameAs) {
          if (Array.isArray(item.sameAs)) {
            item.sameAs.forEach((s: any) => {
              if (typeof s === "string") allSameAsLinks.push(s);
            });
          } else if (typeof item.sameAs === "string") {
            allSameAsLinks.push(item.sameAs);
          }
        }

        // 4. contactPoint
        if (item.contactPoint) {
          const points = Array.isArray(item.contactPoint) ? item.contactPoint : [item.contactPoint];
          for (const cp of points) {
            if (cp.telephone) {
              const val = normalizePhoneNumber(String(cp.telephone), country);
              if (val.isValid && val.normalized) {
                phones.push({
                  type: "phone",
                  value: val.normalized,
                  formattedValue: val.formatted,
                  source: "structured_data",
                  sourceUrl: baseUrl,
                  verified: true,
                  status: "source_verified",
                });
              }
            }
            if (cp.email) {
              const norm = normalizeEmail(String(cp.email));
              if (norm) {
                emails.push({
                  type: "email",
                  value: norm,
                  formattedValue: norm,
                  source: "structured_data",
                  sourceUrl: baseUrl,
                  verified: true,
                  status: "syntax_valid",
                });
              }
            }
          }
        }
      }
    }
  }

  const { discovered: socials } = extractSocialsFromLinks(allSameAsLinks, "structured_data", baseUrl);

  return {
    phones,
    emails,
    socials,
    website: detectedWebsite,
    businessName: detectedName,
  };
}
