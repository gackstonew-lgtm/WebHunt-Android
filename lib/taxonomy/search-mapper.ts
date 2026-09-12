import { PhysicalSearchParams, OnlineSearchParams } from "../types";
import { getIndustriesByIds, matchTextToTaxonomy } from "./index";
import { IndustryDefinition, NormalizedSearchQuery, OsmTagRequirement } from "./types";

/**
 * Normalizes physical search parameters using the global industry taxonomy.
 * Extracts targeted terms, OSM tags, and provider query strings.
 */
export function normalizePhysicalSearchQuery(params: PhysicalSearchParams): NormalizedSearchQuery {
  const rawQuery = params.niche || "";
  let matchedIndustries: IndustryDefinition[] = [];

  // 1. Check if specific industry IDs were supplied
  if (params.industryIds && params.industryIds.length > 0) {
    matchedIndustries = getIndustriesByIds(params.industryIds);
  }

  // 2. If no matched industries from IDs, attempt matching from free-text
  if (matchedIndustries.length === 0 && rawQuery.trim().length > 0) {
    const matched = matchTextToTaxonomy(rawQuery, "physical");
    if (matched) {
      matchedIndustries.push(matched);
    }
  }

  const primaryIndustry = matchedIndustries[0];

  // Aggregate search terms & OSM tags across all matched industries
  const businessSearchTerms: string[] = [];
  const osmTags: OsmTagRequirement[] = [];
  const googleTypes: string[] = [];
  const yelpCategories: string[] = [];
  const foursquareCategories: string[] = [];

  if (matchedIndustries.length > 0) {
    for (const ind of matchedIndustries) {
      businessSearchTerms.push(...ind.businessTerms.queryTerms);
      osmTags.push(...ind.businessTerms.osmTags);
      if (ind.businessTerms.googleTypes) googleTypes.push(...ind.businessTerms.googleTypes);
      if (ind.businessTerms.yelpCategories) yelpCategories.push(...ind.businessTerms.yelpCategories);
      if (ind.businessTerms.foursquareCategories) foursquareCategories.push(...ind.businessTerms.foursquareCategories);
    }
  } else {
    // Custom free-text search fallback
    businessSearchTerms.push(rawQuery);
  }

  const city = params.city || params.locationQuery || "";
  const country = params.country || "Kenya";
  const locationPart = [city, country].filter(Boolean).join(", ");

  const mainTerm = primaryIndustry ? primaryIndustry.name : rawQuery;
  const googleQuery = locationPart ? `${mainTerm} in ${locationPart}` : mainTerm;
  const foursquareQuery = mainTerm;

  return {
    rawQuery,
    matchedIndustries,
    primaryIndustry,
    businessSearchTerms: Array.from(new Set(businessSearchTerms)),
    osmTags,
    googleQuery,
    yelpCategories: Array.from(new Set(yelpCategories)),
    foursquareQuery,
    jobTitles: [],
    jobKeywords: [],
  };
}

/**
 * Normalizes online search parameters using the global industry taxonomy.
 * Extracts targeted job titles, tech stack keywords, and provider-specific category filters.
 */
export function normalizeOnlineSearchQuery(params: OnlineSearchParams): NormalizedSearchQuery {
  const rawQuery = params.query || "";
  let matchedIndustries: IndustryDefinition[] = [];

  if (params.industryIds && params.industryIds.length > 0) {
    matchedIndustries = getIndustriesByIds(params.industryIds);
  }

  if (matchedIndustries.length === 0 && rawQuery.trim().length > 0) {
    const matched = matchTextToTaxonomy(rawQuery, "online");
    if (matched) {
      matchedIndustries.push(matched);
    }
  }

  const primaryIndustry = matchedIndustries[0];

  const jobTitles: string[] = [];
  const jobKeywords: string[] = [];
  let jobCategory = params.category;

  if (matchedIndustries.length > 0) {
    for (const ind of matchedIndustries) {
      jobTitles.push(...ind.jobTerms.titles);
      jobKeywords.push(...ind.jobTerms.keywords);
      if (!jobCategory && ind.jobTerms.category) {
        jobCategory = ind.jobTerms.category;
      }
    }
  } else {
    jobTitles.push(rawQuery);
  }

  return {
    rawQuery,
    matchedIndustries,
    primaryIndustry,
    businessSearchTerms: [],
    osmTags: [],
    googleQuery: "",
    yelpCategories: [],
    foursquareQuery: "",
    jobTitles: Array.from(new Set(jobTitles)),
    jobKeywords: Array.from(new Set(jobKeywords)),
    jobCategory,
  };
}
