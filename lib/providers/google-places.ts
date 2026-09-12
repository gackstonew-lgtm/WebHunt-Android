import { IPhysicalLeadProvider } from "./types";
import { PhysicalLead, PhysicalSearchParams } from "../types";
import { validateAndFormatPhone } from "../validation/phone";
import { parseAndFormatAddress } from "../validation/address";
import { normalizePhysicalSearchQuery } from "../taxonomy/search-mapper";

export class GooglePlacesProvider implements IPhysicalLeadProvider {
  name = "Google Places API";
  providerKey = "google" as const;

  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY.trim() !== "");
  }

  async search(params: PhysicalSearchParams): Promise<PhysicalLead[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn("[GooglePlaces] API key not configured. Skipping Google Places query.");
      return [];
    }

    const normalized = normalizePhysicalSearchQuery(params);
    const country = params.country || "Kenya";
    const city = params.city || params.locationQuery || "";
    const locationStr = [city, country].filter(Boolean).join(", ");
    const query = normalized.googleQuery || `${params.niche} in ${locationStr}`;

    console.log(`[GooglePlaces] Querying: "${query}"`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.addressComponents,places.location",
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: Math.min(params.maxResults || 20, 20),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[GooglePlaces] HTTP error ${response.status}: ${errText}`);
        return [];
      }

      const data = await response.json();
      const places = data.places || [];

      const qualified: PhysicalLead[] = [];

      for (const place of places) {
        // Filter: Keep ONLY if websiteUri is empty/null AND phone exists
        if (place.websiteUri && place.websiteUri.trim() !== "") {
          continue; // Has website -> skip!
        }

        const rawPhone = place.internationalPhoneNumber || place.nationalPhoneNumber;
        if (!rawPhone) continue;

        const phoneValidation = validateAndFormatPhone(rawPhone, country);
        if (!phoneValidation.isValid) continue;

        let itemCity = city;
        let state = "";
        let postalCode = "";

        if (Array.isArray(place.addressComponents)) {
          for (const comp of place.addressComponents) {
            if (comp.types?.includes("locality")) itemCity = comp.longText;
            if (comp.types?.includes("administrative_area_level_1")) state = comp.shortText;
            if (comp.types?.includes("postal_code")) postalCode = comp.longText;
          }
        }

        const addressParsed = parseAndFormatAddress(place.formattedAddress, itemCity, country, postalCode);

        qualified.push({
          id: `google-${place.id}`,
          type: "physical",
          businessName: place.displayName?.text || "Unknown Business",
          phone: phoneValidation.normalized || rawPhone,
          phoneFormatted: phoneValidation.formatted,
          phoneStatus: phoneValidation.status,
          address: addressParsed.formatted,
          city: itemCity || country,
          state: state || null,
          country: country,
          postalCode: postalCode || null,
          latitude: place.location?.latitude || null,
          longitude: place.location?.longitude || null,
          category: place.primaryTypeDisplayName?.text || params.niche,
          rating: typeof place.rating === "number" ? place.rating : null,
          reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : 0,
          hasWebsite: false,
          websiteUrl: null,
          noWebsiteConfidence: "Verified",
          sourceProvider: "google",
          sourceUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text || "")}&query_place_id=${place.id}`,
          sourceType: "business_directory",
          providerPlaceId: place.id,
          status: "NEW",
          estimatedValue: 1500,
          notes: null,
          tags: "google-verified-no-website",
          dataQualityScore: 0.95,
          verificationStatus: "VERIFIED",
          retrievedAt: new Date(),
          lastVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return qualified;
    } catch (error) {
      console.error("[GooglePlaces] Search error:", error);
      return [];
    }
  }
}
