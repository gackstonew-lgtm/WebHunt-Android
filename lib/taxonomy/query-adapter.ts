import { OnlineSearchParams } from "@/lib/types";

export interface NormalizedGeoTarget {
  countryName: string;
  isoCode: string;
  jobicyGeo?: "usa" | "uk" | "canada" | "emea" | "apac" | "latam";
}

export interface AdaptedProviderQuery {
  rawQuery: string;
  cleanQuery: string;
  tokens: string[];
  primaryTag: string;
  geo?: NormalizedGeoTarget;
  isWorldwide: boolean;
}

// Stopwords to exclude when extracting technical keywords
const STOPWORDS = new Set([
  "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with", "from",
  "by", "as", "is", "are", "was", "were", "the", "this", "that", "it",
  "remote", "jobs", "job", "work", "seeking", "wanted", "hiring", "openings",
  "roles", "role", "position", "positions", "looking", "candidate"
]);

// Strict country and region mappings (prevents dangerous substring matches like "us" in "Mauritius")
const GEO_MAPPING: Record<string, NormalizedGeoTarget> = {
  // Kenya & East Africa
  kenya: { countryName: "Kenya", isoCode: "KE", jobicyGeo: "emea" },
  ke: { countryName: "Kenya", isoCode: "KE", jobicyGeo: "emea" },
  nairobi: { countryName: "Kenya", isoCode: "KE", jobicyGeo: "emea" },
  mombasa: { countryName: "Kenya", isoCode: "KE", jobicyGeo: "emea" },
  uganda: { countryName: "Uganda", isoCode: "UG", jobicyGeo: "emea" },
  tanzania: { countryName: "Tanzania", isoCode: "TZ", jobicyGeo: "emea" },
  rwanda: { countryName: "Rwanda", isoCode: "RW", jobicyGeo: "emea" },
  nigeria: { countryName: "Nigeria", isoCode: "NG", jobicyGeo: "emea" },
  ghana: { countryName: "Ghana", isoCode: "GH", jobicyGeo: "emea" },
  "south africa": { countryName: "South Africa", isoCode: "ZA", jobicyGeo: "emea" },
  africa: { countryName: "Africa", isoCode: "AF", jobicyGeo: "emea" },

  // USA & North America
  "united states": { countryName: "United States", isoCode: "US", jobicyGeo: "usa" },
  usa: { countryName: "United States", isoCode: "US", jobicyGeo: "usa" },
  us: { countryName: "United States", isoCode: "US", jobicyGeo: "usa" },
  america: { countryName: "United States", isoCode: "US", jobicyGeo: "usa" },
  canada: { countryName: "Canada", isoCode: "CA", jobicyGeo: "canada" },
  ca: { countryName: "Canada", isoCode: "CA", jobicyGeo: "canada" },

  // United Kingdom & Europe
  "united kingdom": { countryName: "United Kingdom", isoCode: "UK", jobicyGeo: "uk" },
  uk: { countryName: "United Kingdom", isoCode: "UK", jobicyGeo: "uk" },
  england: { countryName: "United Kingdom", isoCode: "UK", jobicyGeo: "uk" },
  britain: { countryName: "United Kingdom", isoCode: "UK", jobicyGeo: "uk" },
  germany: { countryName: "Germany", isoCode: "DE", jobicyGeo: "emea" },
  france: { countryName: "France", isoCode: "FR", jobicyGeo: "emea" },
  netherlands: { countryName: "Netherlands", isoCode: "NL", jobicyGeo: "emea" },
  spain: { countryName: "Spain", isoCode: "ES", jobicyGeo: "emea" },
  italy: { countryName: "Italy", isoCode: "IT", jobicyGeo: "emea" },
  switzerland: { countryName: "Switzerland", isoCode: "CH", jobicyGeo: "emea" },
  ireland: { countryName: "Ireland", isoCode: "IE", jobicyGeo: "emea" },
  europe: { countryName: "Europe", isoCode: "EU", jobicyGeo: "emea" },
  eu: { countryName: "Europe", isoCode: "EU", jobicyGeo: "emea" },
  emea: { countryName: "Europe, Middle East, Africa", isoCode: "EMEA", jobicyGeo: "emea" },

  // Asia & Pacific
  india: { countryName: "India", isoCode: "IN", jobicyGeo: "apac" },
  singapore: { countryName: "Singapore", isoCode: "SG", jobicyGeo: "apac" },
  japan: { countryName: "Japan", isoCode: "JP", jobicyGeo: "apac" },
  australia: { countryName: "Australia", isoCode: "AU", jobicyGeo: "apac" },
  "new zealand": { countryName: "New Zealand", isoCode: "NZ", jobicyGeo: "apac" },
  apac: { countryName: "Asia-Pacific", isoCode: "APAC", jobicyGeo: "apac" },
  asia: { countryName: "Asia", isoCode: "ASIA", jobicyGeo: "apac" },

  // Latin America
  brazil: { countryName: "Brazil", isoCode: "BR", jobicyGeo: "latam" },
  mexico: { countryName: "Mexico", isoCode: "MX", jobicyGeo: "latam" },
  argentina: { countryName: "Argentina", isoCode: "AR", jobicyGeo: "latam" },
  colombia: { countryName: "Colombia", isoCode: "CO", jobicyGeo: "latam" },
  latam: { countryName: "Latin America", isoCode: "LATAM", jobicyGeo: "latam" },
};

/**
 * Normalizes an arbitrary country or location string into an authoritative geo target.
 */
export function normalizeGeoTarget(rawCountry?: string | null): NormalizedGeoTarget | undefined {
  if (!rawCountry) return undefined;
  const cleaned = rawCountry.trim().toLowerCase();
  if (cleaned === "worldwide" || cleaned === "global" || cleaned === "anywhere" || cleaned === "all") {
    return undefined;
  }

  // Exact match first
  if (GEO_MAPPING[cleaned]) {
    return GEO_MAPPING[cleaned];
  }

  // Check word tokens in location string
  const words = cleaned.split(/[\s,]+/);
  for (const w of words) {
    if (GEO_MAPPING[w]) {
      return GEO_MAPPING[w];
    }
  }

  return undefined;
}

/**
 * Extracts clean, distinct keyword tokens from user search query.
 * Strips punctuation, slashes, and common query noise.
 */
export function extractQueryTokens(rawQuery: string): string[] {
  if (!rawQuery) return [];
  const normalized = rawQuery
    .toLowerCase()
    .replace(/[\\/|,+&():;?!'"[\]{}<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = normalized.split(" ");
  const tokens: string[] = [];

  for (const w of words) {
    const clean = w.trim();
    if (clean.length > 1 && !STOPWORDS.has(clean)) {
      tokens.push(clean);
    }
  }

  // Preserve compound tech terms
  if (rawQuery.toLowerCase().includes("next.js") || rawQuery.toLowerCase().includes("nextjs")) {
    if (!tokens.includes("next.js")) tokens.push("next.js");
    if (!tokens.includes("nextjs")) tokens.push("nextjs");
  }
  if (rawQuery.toLowerCase().includes("react.js") || rawQuery.toLowerCase().includes("reactjs")) {
    if (!tokens.includes("react")) tokens.push("react");
  }
  if (rawQuery.toLowerCase().includes("node.js") || rawQuery.toLowerCase().includes("nodejs")) {
    if (!tokens.includes("node.js")) tokens.push("node.js");
    if (!tokens.includes("nodejs")) tokens.push("nodejs");
  }
  if (rawQuery.toLowerCase().includes("vue.js") || rawQuery.toLowerCase().includes("vuejs")) {
    if (!tokens.includes("vue")) tokens.push("vue");
  }

  return Array.from(new Set(tokens));
}

/**
 * Selects the single best keyword slug for tag-based APIs (Jobicy, Remote OK).
 */
export function selectPrimaryTag(tokens: string[], rawQuery: string): string {
  if (tokens.length === 0) return "developer";

  // High priority specific technology terms
  const techPriority = [
    "react", "nextjs", "next.js", "python", "javascript", "typescript",
    "node", "nodejs", "vue", "angular", "rust", "golang", "java", "ruby",
    "devops", "aws", "docker", "kubernetes", "flutter", "swift", "kotlin",
    "frontend", "backend", "fullstack", "design", "figma", "ai", "writer",
    "marketing", "sales", "support", "developer", "engineer"
  ];

  for (const tp of techPriority) {
    if (tokens.includes(tp)) {
      // Normalize next.js -> nextjs for tag slugs
      return tp === "next.js" ? "nextjs" : tp === "node.js" ? "nodejs" : tp;
    }
  }

  // Fallback to first non-generic token or developer
  return tokens[0] || "developer";
}

/**
 * Adapts raw search params into provider-specific parameters.
 * Supports both adaptQueryForProvider(params) and adaptQueryForProvider(providerKey, params).
 */
export function adaptQueryForProvider(
  paramsOrProviderKey: OnlineSearchParams | string,
  maybeParams?: OnlineSearchParams
): AdaptedProviderQuery {
  const params: OnlineSearchParams =
    typeof paramsOrProviderKey === "object"
      ? paramsOrProviderKey
      : maybeParams || { mode: "online", query: "" };

  const rawQuery = (params.query || "").trim();
  const tokens = extractQueryTokens(rawQuery);
  const primaryTag = selectPrimaryTag(tokens, rawQuery);
  const geo = normalizeGeoTarget(params.country);
  const isWorldwide = !geo;
  const cleanQuery = tokens.length > 0 ? tokens.join(" ") : rawQuery;

  return {
    rawQuery,
    cleanQuery,
    tokens,
    primaryTag,
    geo,
    isWorldwide,
  };
}

/**
 * Deterministically checks if a lead matches search tokens.
 * Overloaded to support:
 *   Signature A: leadMatchesSearchTokens(lead, tokens)
 *   Signature B: leadMatchesSearchTokens(tokens, title, descriptionSnippet, extraKeywords)
 */
export function leadMatchesSearchTokens(
  arg1: { title?: string | null; descriptionSnippet?: string | null; tags?: string[] | null; company?: string | null } | string[],
  arg2?: string[] | string | null,
  arg3?: string | null,
  arg4?: (string | null | undefined)[]
): boolean {
  let tokens: string[] = [];
  let title = "";
  let desc = "";
  let extraText = "";

  if (Array.isArray(arg1)) {
    // Signature B: (tokens, title, descriptionSnippet, extraKeywords)
    tokens = arg1;
    title = (arg2 as string || "").toLowerCase();
    desc = (arg3 || "").toLowerCase();
    extraText = Array.isArray(arg4) ? arg4.filter(Boolean).join(" ").toLowerCase() : "";
  } else {
    // Signature A: (lead, tokens)
    tokens = Array.isArray(arg2) ? arg2 : [];
    title = (arg1?.title || "").toLowerCase();
    desc = (arg1?.descriptionSnippet || "").toLowerCase();
    const company = (arg1?.company || "").toLowerCase();
    const tagsStr = Array.isArray(arg1?.tags) ? arg1.tags.join(" ").toLowerCase() : "";
    extraText = `${company} ${tagsStr}`;
  }

  if (!tokens || tokens.length === 0) return true;

  // 1. Direct match: Any token appears in title or extra text (company / tags / category)
  for (const tok of tokens) {
    if (title.includes(tok) || extraText.includes(tok)) {
      return true;
    }
  }

  // 2. Token match in description snippet: Requires at least 1 token match
  for (const tok of tokens) {
    if (tok.length >= 3 && desc.includes(tok)) {
      return true;
    }
  }

  return false;
}
