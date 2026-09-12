import { LeadMode } from "../types";
import { INDUSTRY_CATEGORIES, INDUSTRY_TAXONOMY } from "./industries";
import { IndustryCategory, IndustryDefinition, SelectedIndustryItem } from "./types";

export * from "./types";
export * from "./industries";

// Pre-indexed map for O(1) canonical ID lookup
const industryIdMap = new Map<string, IndustryDefinition>();
for (const ind of INDUSTRY_TAXONOMY) {
  industryIdMap.set(ind.id, ind);
}

/**
 * Look up an industry definition by canonical ID.
 */
export function getIndustryById(id: string): IndustryDefinition | undefined {
  if (!id) return undefined;
  return industryIdMap.get(id.toLowerCase().trim());
}

/**
 * Look up multiple industry definitions by their canonical IDs.
 */
export function getIndustriesByIds(ids: string[]): IndustryDefinition[] {
  if (!Array.isArray(ids)) return [];
  const found: IndustryDefinition[] = [];
  for (const id of ids) {
    const item = getIndustryById(id);
    if (item) found.push(item);
  }
  return found;
}

/**
 * Get popular industry shortcuts for quick presets.
 */
export function getPopularIndustries(mode?: LeadMode): IndustryDefinition[] {
  return INDUSTRY_TAXONOMY.filter((ind) => {
    if (mode && !ind.applicableModes.includes(mode)) return false;
    return ind.isPopular === true;
  });
}

/**
 * Get hierarchical category groups containing their respective industries.
 */
export function getCategoriesWithIndustries(mode?: LeadMode): {
  category: IndustryCategory;
  industries: IndustryDefinition[];
}[] {
  return INDUSTRY_CATEGORIES.filter((cat) => {
    if (mode && !cat.applicableModes.includes(mode)) return false;
    return true;
  }).map((cat) => {
    const industries = INDUSTRY_TAXONOMY.filter((ind) => {
      if (ind.categoryId !== cat.id) return false;
      if (mode && !ind.applicableModes.includes(mode)) return false;
      return true;
    });
    return {
      category: cat,
      industries,
    };
  }).filter((group) => group.industries.length > 0);
}

/**
 * Fast sub-millisecond search across taxonomy names, aliases, keywords, and categories.
 * Optimized for live autocomplete, type-ahead, and free-text matching.
 */
export function searchTaxonomy(query: string, mode?: LeadMode, limit: number = 25): IndustryDefinition[] {
  if (!query || query.trim().length === 0) {
    return INDUSTRY_TAXONOMY.filter((ind) => !mode || ind.applicableModes.includes(mode)).slice(0, limit);
  }

  const cleanQuery = query.toLowerCase().trim();
  const stopWords = new Set(["in", "near", "at", "for", "and", "the", "of", "with", "services", "service", "company"]);
  
  // Extract meaningful tokens
  const queryTokens = cleanQuery
    .split(/[\s,./-]+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !stopWords.has(t));

  const scoredResults: Array<{ ind: IndustryDefinition; score: number }> = [];

  for (const ind of INDUSTRY_TAXONOMY) {
    if (mode && !ind.applicableModes.includes(mode)) continue;

    let score = 0;
    const nameLower = ind.name.toLowerCase();
    const idLower = ind.id.toLowerCase();
    const allAliases = ind.aliases.map(a => a.toLowerCase());
    const queryTerms = ind.businessTerms.queryTerms.map(t => t.toLowerCase());
    const jobTitles = ind.jobTerms.titles.map(t => t.toLowerCase());
    const jobKeywords = ind.jobTerms.keywords.map(k => k.toLowerCase());

    // 1. Exact ID or Name match
    if (nameLower === cleanQuery || idLower === cleanQuery) {
      score += 100;
    } 
    // 2. Name starts with query
    else if (nameLower.startsWith(cleanQuery)) {
      score += 80;
    }
    // 3. Name contains full query
    else if (nameLower.includes(cleanQuery)) {
      score += 60;
    }

    // 4. Exact or substring alias match
    for (const alias of allAliases) {
      if (alias === cleanQuery) {
        score = Math.max(score, 90);
      } else if (alias.startsWith(cleanQuery)) {
        score = Math.max(score, 70);
      } else if (alias.includes(cleanQuery) || cleanQuery.includes(alias)) {
        score = Math.max(score, 55);
      }
    }

    // 5. Query terms & job titles match
    for (const term of queryTerms) {
      if (term === cleanQuery) score = Math.max(score, 85);
      else if (term.includes(cleanQuery) || cleanQuery.includes(term)) score = Math.max(score, 50);
    }

    for (const title of jobTitles) {
      if (title === cleanQuery) score = Math.max(score, 85);
      else if (title.includes(cleanQuery) || cleanQuery.includes(title)) score = Math.max(score, 50);
    }

    // 6. Token-based matching with stemming
    let matchedTokenCount = 0;
    for (const token of queryTokens) {
      const stem = token.length >= 4 ? token.slice(0, token.length - 2) : token;

      const matches = 
        nameLower.includes(token) || 
        nameLower.includes(stem) ||
        allAliases.some(a => a.includes(token) || a.includes(stem)) ||
        queryTerms.some(t => t.includes(token) || t.includes(stem)) ||
        jobTitles.some(t => t.includes(token) || t.includes(stem)) ||
        jobKeywords.some(k => k.includes(token));

      if (matches) {
        matchedTokenCount++;
        score += 25;
      }
    }

    // Boost if multiple tokens match
    if (queryTokens.length > 1 && matchedTokenCount >= queryTokens.length) {
      score += 35;
    }

    if (score > 0) {
      scoredResults.push({ ind, score });
    }
  }

  // Sort descending by score, then alphabetically
  scoredResults.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.ind.name.localeCompare(b.ind.name);
  });

  return scoredResults.slice(0, limit).map((r) => r.ind);
}

/**
 * Intelligent fuzzy matcher to associate any user free-text query with a canonical taxonomy definition.
 * If user types "Solar panel installers", it matches "solar_renewable_energy".
 * If user types "Mechanics in Nairobi", it matches "auto_repair".
 */
export function matchTextToTaxonomy(text: string, mode?: LeadMode): IndustryDefinition | null {
  if (!text || text.trim().length === 0) return null;
  const matches = searchTaxonomy(text, mode, 1);
  return matches.length > 0 ? matches[0] : null;
}
