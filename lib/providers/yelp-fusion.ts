import { IPhysicalLeadProvider } from "./types";
import { PhysicalLead, PhysicalSearchParams } from "../types";
import { validateAndFormatPhone } from "../validation/phone";
import { parseAndFormatAddress } from "../validation/address";
import { normalizePhysicalSearchQuery } from "../taxonomy/search-mapper";

export class YelpFusionProvider implements IPhysicalLeadProvider {
  name = "Yelp Fusion API";
  providerKey = "yelp" as const;

  isConfigured(): boolean {
    return Boolean(process.env.YELP_API_KEY && process.env.YELP_API_KEY.trim() !== "");
  }

  async search(params: PhysicalSearchParams): Promise<PhysicalLead[]> {
    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) {
      console.warn("[YelpFusion] YELP_API_KEY not found in environment.");
      return [];
    }

    const normalized = normalizePhysicalSearchQuery(params);
    const country = params.country || "Kenya";
    const city = params.city || params.locationQuery || (country === "Kenya" ? "Nairobi" : "Austin");
    const location = [city, country].filter(Boolean).join(", ");
    const term = normalized.primaryIndustry ? normalized.primaryIndustry.name : (params.niche || "business");

    console.log(`[YelpFusion] Querying term="${term}" location="${location}"`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = new URL("https://api.yelp.com/v3/businesses/search");
      url.searchParams.set("term", term);
      url.searchParams.set("location", location);
      if (normalized.yelpCategories.length > 0) {
        url.searchParams.set("categories", normalized.yelpCategories.join(","));
      }
      url.searchParams.set("limit", String(Math.min(params.maxResults || 20, 25)));

      const res = await fetch(url.toString(), {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
          "User-Agent": "WebHunt-Discovery/2.0",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`[YelpFusion] HTTP error ${res.status}: ${res.statusText}`);
        return [];
      }

      const data = await res.json();
      const businesses = data.businesses || [];
      const results: PhysicalLead[] = [];

      for (const biz of businesses) {
        if (biz.is_closed) continue;

        const rawPhone = biz.phone || biz.display_phone;
        if (!rawPhone) continue;

        const phoneValidation = validateAndFormatPhone(rawPhone, country);
        if (!phoneValidation.isValid) continue;

        const addressLine = Array.isArray(biz.location?.display_address)
          ? biz.location.display_address.join(", ")
          : biz.location?.address1 || "";

        const itemCity = biz.location?.city || city;
        const itemState = biz.location?.state || "";
        const postalCode = biz.location?.zip_code || "";

        const addressParsed = parseAndFormatAddress(addressLine, itemCity, country, postalCode);
        const categories = Array.isArray(biz.categories)
          ? biz.categories.map((c: any) => c.title).join(", ")
          : term;

        results.push({
          id: `yelp-${biz.id}`,
          type: "physical",
          businessName: biz.name || "Local Business",
          phone: phoneValidation.normalized || rawPhone,
          phoneFormatted: phoneValidation.formatted,
          phoneStatus: phoneValidation.status,
          address: addressParsed.formatted,
          city: itemCity,
          state: itemState || null,
          country: country,
          postalCode: postalCode || null,
          latitude: biz.coordinates?.latitude || null,
          longitude: biz.coordinates?.longitude || null,
          category: categories,
          rating: typeof biz.rating === "number" ? biz.rating : null,
          reviewCount: typeof biz.review_count === "number" ? biz.review_count : 0,
          hasWebsite: false,
          websiteUrl: null,
          noWebsiteConfidence: "Verified",
          sourceProvider: "yelp",
          sourceUrl: biz.url || `https://www.yelp.com/biz/${biz.id}`,
          sourceType: "business_directory",
          providerPlaceId: biz.id,
          status: "NEW",
          estimatedValue: 1500,
          notes: null,
          tags: "yelp-directory-lead",
          dataQualityScore: 0.90,
          verificationStatus: "SOURCE_LISTED",
          retrievedAt: new Date(),
          lastVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return results;
    } catch (err) {
      console.error("[YelpFusion] Search error:", err);
      return [];
    }
  }
}
