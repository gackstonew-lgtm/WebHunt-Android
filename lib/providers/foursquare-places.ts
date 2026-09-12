import { IPhysicalLeadProvider } from "./types";
import { PhysicalLead, PhysicalSearchParams } from "../types";
import { validateAndFormatPhone } from "../validation/phone";
import { parseAndFormatAddress } from "../validation/address";
import { normalizePhysicalSearchQuery } from "../taxonomy/search-mapper";

export class FoursquarePlacesProvider implements IPhysicalLeadProvider {
  name = "Foursquare Places API";
  providerKey = "foursquare" as const;

  isConfigured(): boolean {
    return Boolean(process.env.FOURSQUARE_API_KEY && process.env.FOURSQUARE_API_KEY.trim() !== "");
  }

  async search(params: PhysicalSearchParams): Promise<PhysicalLead[]> {
    const apiKey = process.env.FOURSQUARE_API_KEY;
    if (!apiKey) {
      console.warn("[Foursquare] FOURSQUARE_API_KEY not found in environment.");
      return [];
    }

    const normalized = normalizePhysicalSearchQuery(params);
    const country = params.country || "Kenya";
    const city = params.city || params.locationQuery || (country === "Kenya" ? "Nairobi" : "London");
    const near = [city, country].filter(Boolean).join(", ");
    const query = normalized.primaryIndustry ? normalized.primaryIndustry.name : (params.niche || "services");

    console.log(`[Foursquare] Querying query="${query}" near="${near}"`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = new URL("https://api.foursquare.com/v3/places/search");
      url.searchParams.set("query", query);
      url.searchParams.set("near", near);
      url.searchParams.set("fields", "fsq_id,name,location,tel,categories,rating,stats,website");
      url.searchParams.set("limit", String(Math.min(params.maxResults || 20, 25)));

      const res = await fetch(url.toString(), {
        headers: {
          "Authorization": apiKey,
          "Accept": "application/json",
          "User-Agent": "WebHunt-Discovery/2.0",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`[Foursquare] HTTP error ${res.status}: ${res.statusText}`);
        return [];
      }

      const data = await res.json();
      const places = data.results || [];
      const results: PhysicalLead[] = [];

      for (const place of places) {
        // Skip if website exists
        if (place.website && place.website.trim() !== "") {
          continue;
        }

        const rawPhone = place.tel;
        if (!rawPhone) continue;

        const phoneValidation = validateAndFormatPhone(rawPhone, country);
        if (!phoneValidation.isValid) continue;

        const addressLine = place.location?.formatted_address || place.location?.address || "";
        const itemCity = place.location?.locality || city;
        const itemState = place.location?.region || "";
        const postalCode = place.location?.postcode || "";

        const addressParsed = parseAndFormatAddress(addressLine, itemCity, country, postalCode);
        const category = Array.isArray(place.categories) && place.categories.length > 0
          ? place.categories[0].name
          : query;

        results.push({
          id: `fsq-${place.fsq_id}`,
          type: "physical",
          businessName: place.name || "Local Business",
          phone: phoneValidation.normalized || rawPhone,
          phoneFormatted: phoneValidation.formatted,
          phoneStatus: phoneValidation.status,
          address: addressParsed.formatted,
          city: itemCity,
          state: itemState || null,
          country: country,
          postalCode: postalCode || null,
          latitude: place.geocodes?.main?.latitude || null,
          longitude: place.geocodes?.main?.longitude || null,
          category: category,
          rating: typeof place.rating === "number" ? place.rating / 2.0 : null, // Foursquare is 0-10 scale, normalize to 0-5
          reviewCount: place.stats?.total_ratings || 0,
          hasWebsite: false,
          websiteUrl: null,
          noWebsiteConfidence: "Verified",
          sourceProvider: "foursquare",
          sourceUrl: `https://foursquare.com/v/${place.fsq_id}`,
          sourceType: "business_directory",
          providerPlaceId: place.fsq_id,
          status: "NEW",
          estimatedValue: 1500,
          notes: null,
          tags: "fsq-verified-lead",
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
      console.error("[Foursquare] Search error:", err);
      return [];
    }
  }
}
