import { IPhysicalLeadProvider } from "./types";
import { PhysicalLead, PhysicalSearchParams } from "../types";
import { validateAndFormatPhone } from "../validation/phone";
import { parseAndFormatAddress } from "../validation/address";
import { normalizePhysicalSearchQuery } from "../taxonomy/search-mapper";

export class OsmOverpassProvider implements IPhysicalLeadProvider {
  name = "OpenStreetMap Overpass API (Free Worldwide)";
  providerKey = "osm" as const;

  isConfigured(): boolean {
    return true; // Zero API key required, 100% free worldwide coverage
  }

  async search(params: PhysicalSearchParams): Promise<PhysicalLead[]> {
    const normalized = normalizePhysicalSearchQuery(params);
    const country = params.country || "Kenya";
    const city = params.city || params.locationQuery || "";
    const fullLocationQuery = [city, country].filter(Boolean).join(", ");
    const primaryTerm = normalized.primaryIndustry ? normalized.primaryIndustry.name : params.niche;

    console.log(`[OSM] Querying OpenStreetMap for "${primaryTerm}" (${normalized.matchedIndustries.map(m => m.id).join(", ") || "custom"}) in "${fullLocationQuery}"`);

    // Strategy 1: Fast Overpass API Query with targeted tags
    const overpassResults = await this.queryOverpass(params, normalized, city, country, fullLocationQuery);
    if (overpassResults.length > 0) {
      return overpassResults;
    }

    // Strategy 2: Fast Nominatim Direct POI Search Fallback (Zero-key, high resilience)
    console.log(`[OSM] Attempting Nominatim POI fallback for "${primaryTerm}" in "${fullLocationQuery}"`);
    return await this.queryNominatimPoi(params, normalized, city, country, fullLocationQuery);
  }

  private async queryOverpass(
    params: PhysicalSearchParams,
    normalized: ReturnType<typeof normalizePhysicalSearchQuery>,
    city: string,
    country: string,
    fullLocationQuery: string
  ): Promise<PhysicalLead[]> {
    try {
      // 1. Geocode location
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        fullLocationQuery
      )}&format=json&limit=1`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const geoRes = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "WebHunt-Discovery/2.0 (webhunt-leadgen-platform)",
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!geoRes.ok) return [];
      const geoData = await geoRes.json();
      if (!Array.isArray(geoData) || geoData.length === 0) return [];

      const lat = parseFloat(geoData[0].lat);
      const lon = parseFloat(geoData[0].lon);
      const radiusMeters = Math.min((params.radius || 20) * 1609.34, 25000); // 25km radius

      // Build targeted tag filters if available
      let tagClauses = "";
      if (normalized.osmTags.length > 0) {
        tagClauses = normalized.osmTags.slice(0, 8).map(t => `
          node(around:${radiusMeters},${lat},${lon})["${t.key}"="${t.value}"];
          way(around:${radiusMeters},${lat},${lon})["${t.key}"="${t.value}"];
        `).join("");
      } else {
        const keyword = (normalized.businessSearchTerms[0] || params.niche || "business").split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");
        tagClauses = `
          node(around:${radiusMeters},${lat},${lon})["name"~"${keyword}",i];
          way(around:${radiusMeters},${lat},${lon})["name"~"${keyword}",i];
          node(around:${radiusMeters},${lat},${lon})["craft"];
          node(around:${radiusMeters},${lat},${lon})["shop"];
          node(around:${radiusMeters},${lat},${lon})["amenity"];
          node(around:${radiusMeters},${lat},${lon})["office"];
        `;
      }

      const query = `
        [out:json][timeout:15];
        (
          ${tagClauses}
        );
        out body 60;
      `;

      // Prioritize high-performance fast mirror endpoints with automatic failover
      const endpoints = [
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass-api.de/api/interpreter",
      ];

      for (const endpoint of endpoints) {
        try {
          const fetchCtrl = new AbortController();
          const fetchTimer = setTimeout(() => fetchCtrl.abort(), 8000);

          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "WebHunt-Discovery/2.0 (webhunt-leadgen-platform)",
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: fetchCtrl.signal,
          });
          clearTimeout(fetchTimer);

          if (res.ok) {
            const data = await res.json();
            const elements = data.elements || [];
            const primaryTerm = normalized.primaryIndustry ? normalized.primaryIndustry.name : params.niche;
            const parsed = this.parseOsmElements(elements, primaryTerm, city, country, params.maxResults || 25);
            if (parsed.length > 0) return parsed;
          }
        } catch (e) {
          // Gracefully continue to next failover mirror
        }
      }

      return [];
    } catch (err) {
      return [];
    }
  }

  private async queryNominatimPoi(
    params: PhysicalSearchParams,
    normalized: ReturnType<typeof normalizePhysicalSearchQuery>,
    city: string,
    country: string,
    fullLocationQuery: string
  ): Promise<PhysicalLead[]> {
    try {
      const mainTerm = normalized.primaryIndustry ? normalized.primaryIndustry.name : params.niche;
      const cleanMainTerm = mainTerm.split("&")[0].trim();
      const searchTerms = [
        `${cleanMainTerm}, ${city || country}`,
        `${cleanMainTerm}, ${country}`,
        `${cleanMainTerm} in ${fullLocationQuery}`,
        ...normalized.businessSearchTerms.slice(0, 3).map(t => `${t}, ${city || country}`),
      ];
      
      for (const term of searchTerms) {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          term
        )}&format=json&limit=35&extratags=1&addressdetails=1`;

        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);

        const res = await fetch(url, {
          headers: {
            "User-Agent": "WebHunt-Discovery/2.0 (webhunt-leadgen-platform)",
            "Accept": "application/json",
          },
          signal: ctrl.signal,
        });
        clearTimeout(timer);

        if (!res.ok) continue;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) continue;

        const results: PhysicalLead[] = [];
        const seenKeys = new Set<string>();

        for (const item of data) {
          const name = item.display_name ? item.display_name.split(",")[0].trim() : (item.name || "");
          if (!name) continue;

          const extra = item.extratags || {};
          const rawPhone = extra.phone || extra["contact:phone"] || extra["phone:mobile"] || "";
          const website = extra.website || extra["contact:website"] || extra.url || "";

          // Keep businesses without website on record
          if (website && website.trim() !== "") continue;

          const phoneValidation = rawPhone 
            ? validateAndFormatPhone(rawPhone, country)
            : { isValid: false, normalized: "", formatted: "Phone unavailable", status: "unavailable" as const };

          const dedupKey = phoneValidation.isValid 
            ? phoneValidation.normalized 
            : `${name.toLowerCase()}_${(city || country).toLowerCase()}`;

          if (seenKeys.has(dedupKey)) continue;
          seenKeys.add(dedupKey);

          const addr = item.address || {};
          const street = [addr.house_number, addr.road || addr.street].filter(Boolean).join(" ");
          const itemCity = addr.city || addr.town || addr.suburb || city || country;
          const itemState = addr.state || "";
          const postalCode = addr.postcode || "";

          const parsedAddress = parseAndFormatAddress(street || item.display_name, itemCity, country, postalCode);
          const osmUrl = `https://www.openstreetmap.org/${item.osm_type || "node"}/${item.osm_id}`;

          // Extract potential contact metadata from OSM tags
          const email = extra.email || extra["contact:email"] || null;
          const whatsapp = extra.whatsapp || extra["contact:whatsapp"] || extra["phone:whatsapp"] || null;
          const facebook = extra.facebook || extra["contact:facebook"] || null;
          const instagram = extra.instagram || extra["contact:instagram"] || null;
          const twitter = extra.twitter || extra["contact:twitter"] || extra["contact:x"] || null;
          const linkedin = extra.linkedin || extra["contact:linkedin"] || null;
          const youtube = extra.youtube || extra["contact:youtube"] || null;
          const tiktok = extra.tiktok || extra["contact:tiktok"] || null;
          const telegram = extra.telegram || extra["contact:telegram"] || null;

          const socialProfiles: Record<string, string> = {};
          if (facebook) socialProfiles.facebook = facebook;
          if (instagram) socialProfiles.instagram = instagram;
          if (twitter) socialProfiles.twitter = twitter;
          if (linkedin) socialProfiles.linkedin = linkedin;
          if (youtube) socialProfiles.youtube = youtube;
          if (tiktok) socialProfiles.tiktok = tiktok;
          if (telegram) socialProfiles.telegram = telegram;

          results.push({
            id: `osm-${item.osm_type || "poi"}-${item.osm_id}`,
            type: "physical",
            businessName: name,
            phone: phoneValidation.normalized || rawPhone || "",
            phoneFormatted: phoneValidation.formatted || "Phone unavailable",
            phoneStatus: phoneValidation.status,
            email: email,
            emails: email ? [email] : [],
            whatsapp: whatsapp,
            socialProfiles: Object.keys(socialProfiles).length > 0 ? socialProfiles : undefined,
            address: parsedAddress.formatted,
            city: itemCity,
            state: itemState || null,
            country: country,
            postalCode: postalCode || null,
            latitude: item.lat ? parseFloat(item.lat) : null,
            longitude: item.lon ? parseFloat(item.lon) : null,
            category: item.type || item.class || cleanMainTerm,
            rating: null,
            reviewCount: 0,
            hasWebsite: false,
            websiteUrl: null,
            websiteStatus: "NO_WEBSITE",
            websiteOpportunity: "NO_WEBSITE",
            noWebsiteConfidence: "Verified",
            sourceProvider: "osm",
            sources: ["osm"],
            provenance: [{ source: "osm", sourceUrl: osmUrl, retrievedAt: new Date() }],
            sourceUrl: osmUrl,
            sourceType: "business_directory",
            providerPlaceId: `osm-${item.osm_id}`,
            status: "NEW",
            estimatedValue: country.toLowerCase().includes("kenya") ? 1200 : 1500,
            notes: null,
            tags: "candidate-lead",
            dataQualityScore: phoneValidation.isValid ? 0.88 : 0.65,
            verificationStatus: "SOURCE_LISTED",
            retrievedAt: new Date(),
            lastVerifiedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          if (results.length >= (params.maxResults || 25)) break;
        }

        if (results.length > 0) return results;
      }

      return [];
    } catch (err) {
      console.warn("[OSM] Nominatim POI fallback error:", err);
      return [];
    }
  }

  private parseOsmElements(
    elements: any[],
    niche: string,
    city: string,
    country: string,
    maxResults: number
  ): PhysicalLead[] {
    const results: PhysicalLead[] = [];
    const seenKeys = new Set<string>();

    for (const el of elements) {
      const tags = el.tags || {};
      const name = tags.name || tags["brand"] || tags["operator"] || tags["shop"] || tags["amenity"];
      if (!name) continue;

      // Filter: Keep only businesses without websites on record
      if (tags.website || tags["contact:website"] || tags["url"]) continue;

      const rawPhone = tags.phone || tags["contact:phone"] || tags["phone:mobile"];
      const phoneValidation = rawPhone 
        ? validateAndFormatPhone(rawPhone, country)
        : { isValid: false, normalized: "", formatted: "Phone unavailable", status: "unavailable" as const };

      const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
      const itemCity = tags["addr:city"] || city || tags["addr:suburb"] || country;
      const itemState = tags["addr:state"] || tags["addr:province"] || "";
      const postalCode = tags["addr:postcode"] || "";

      // Deduplicate using normalized phone if available, or name + city
      const dedupKey = phoneValidation.isValid 
        ? phoneValidation.normalized 
        : `${name.toLowerCase()}_${itemCity.toLowerCase()}`;

      if (seenKeys.has(dedupKey)) continue;
      seenKeys.add(dedupKey);

      const category =
        tags.shop ||
        tags.amenity ||
        tags.craft ||
        tags.office ||
        tags.healthcare ||
        tags.tourism ||
        tags.leisure ||
        niche;

      const addressParsed = parseAndFormatAddress(street, itemCity, country, postalCode);
      const osmWebUrl = `https://www.openstreetmap.org/${el.type || "node"}/${el.id}`;

      // Extract contact metadata from OSM tags
      const email = tags.email || tags["contact:email"] || null;
      const whatsapp = tags.whatsapp || tags["contact:whatsapp"] || tags["phone:whatsapp"] || null;
      const facebook = tags.facebook || tags["contact:facebook"] || null;
      const instagram = tags.instagram || tags["contact:instagram"] || null;
      const twitter = tags.twitter || tags["contact:twitter"] || tags["contact:x"] || null;
      const linkedin = tags.linkedin || tags["contact:linkedin"] || null;
      const youtube = tags.youtube || tags["contact:youtube"] || null;
      const tiktok = tags.tiktok || tags["contact:tiktok"] || null;
      const telegram = tags.telegram || tags["contact:telegram"] || null;

      const socialProfiles: Record<string, string> = {};
      if (facebook) socialProfiles.facebook = facebook;
      if (instagram) socialProfiles.instagram = instagram;
      if (twitter) socialProfiles.twitter = twitter;
      if (linkedin) socialProfiles.linkedin = linkedin;
      if (youtube) socialProfiles.youtube = youtube;
      if (tiktok) socialProfiles.tiktok = tiktok;
      if (telegram) socialProfiles.telegram = telegram;

      results.push({
        id: `osm-${el.type}-${el.id}`,
        type: "physical",
        businessName: name,
        phone: phoneValidation.normalized || rawPhone || "",
        phoneFormatted: phoneValidation.formatted || "Phone unavailable",
        phoneStatus: phoneValidation.status,
        email: email,
        emails: email ? [email] : [],
        whatsapp: whatsapp,
        socialProfiles: Object.keys(socialProfiles).length > 0 ? socialProfiles : undefined,
        address: addressParsed.formatted,
        city: itemCity,
        state: itemState || null,
        country: country,
        postalCode: postalCode || null,
        latitude: el.lat || null,
        longitude: el.lon || null,
        category: category,
        rating: tags["stars"] ? parseFloat(tags["stars"]) : null,
        reviewCount: 0,
        hasWebsite: false,
        websiteUrl: null,
        websiteStatus: "NO_WEBSITE",
        websiteOpportunity: "NO_WEBSITE",
        noWebsiteConfidence: "Verified",
        sourceProvider: "osm",
        sources: ["osm"],
        provenance: [{ source: "osm", sourceUrl: osmWebUrl, retrievedAt: new Date() }],
        sourceUrl: osmWebUrl,
        sourceType: "business_directory",
        providerPlaceId: `osm-${el.id}`,
        status: "NEW",
        estimatedValue: country.toLowerCase().includes("kenya") ? 1200 : 1500,
        notes: null,
        tags: "candidate-lead",
        dataQualityScore: phoneValidation.isValid ? 0.88 : 0.65,
        verificationStatus: "SOURCE_LISTED",
        retrievedAt: new Date(),
        lastVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (results.length >= maxResults) break;
    }

    return results;
  }
}
