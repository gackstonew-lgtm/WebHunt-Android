import { PhysicalLead, OnlineJobLead } from "../types";
import { IndustryDefinition } from "../taxonomy/types";

export interface RelevanceScoreResult {
  score: number; // 0.0 to 1.0
  isRelevant: boolean;
  matchReason: string;
}

/**
 * Evaluates the relevance of a physical business lead against target industries.
 */
export function scorePhysicalLeadRelevance(
  lead: PhysicalLead,
  targetIndustries: IndustryDefinition[],
  rawQuery: string
): RelevanceScoreResult {
  if (!lead) {
    return { score: 0, isRelevant: false, matchReason: "Empty lead" };
  }

  // If no structured taxonomy matched, fallback to raw query string matching
  if (!targetIndustries || targetIndustries.length === 0) {
    const q = rawQuery.toLowerCase().trim();
    if (!q) return { score: 1.0, isRelevant: true, matchReason: "All results accepted" };

    const name = (lead.businessName || "").toLowerCase();
    const category = (lead.category || "").toLowerCase();
    const tags = Array.isArray(lead.tags) ? lead.tags.join(" ").toLowerCase() : (lead.tags || "").toLowerCase();

    if (name.includes(q) || category.includes(q)) {
      return { score: 0.9, isRelevant: true, matchReason: "Direct text query match" };
    }
    if (tags.includes(q)) {
      return { score: 0.75, isRelevant: true, matchReason: "Tag text query match" };
    }

    // Token match
    const tokens = q.split(/\s+/).filter((t) => t.length > 2);
    const matchesToken = tokens.some((t) => name.includes(t) || category.includes(t) || tags.includes(t));
    if (matchesToken) {
      return { score: 0.6, isRelevant: true, matchReason: "Partial query match" };
    }

    return { score: 0.3, isRelevant: true, matchReason: "Generic match (no taxonomy)" };
  }

  const name = (lead.businessName || "").toLowerCase();
  const category = (lead.category || "").toLowerCase();
  const tags = Array.isArray(lead.tags) ? lead.tags.join(" ").toLowerCase() : (lead.tags || "").toLowerCase();

  let highestScore = 0;
  let bestReason = "Unrelated business";

  for (const ind of targetIndustries) {
    const indName = ind.name.toLowerCase();
    const aliases = ind.aliases.map((a) => a.toLowerCase());
    const queryTerms = ind.businessTerms.queryTerms.map((t) => t.toLowerCase());

    // 1. Exact or Primary Category match
    if (category.includes(ind.id) || aliases.some((a) => category.includes(a)) || queryTerms.some((t) => category.includes(t))) {
      highestScore = Math.max(highestScore, 0.95);
      bestReason = `Category match: ${lead.category}`;
      continue;
    }

    // 2. Business Name + Category strong match
    if (aliases.some((a) => name.includes(a)) || queryTerms.some((t) => name.includes(t))) {
      highestScore = Math.max(highestScore, 0.90);
      bestReason = `Business name match: ${lead.businessName}`;
      continue;
    }

    // 3. Tag match
    if (aliases.some((a) => tags.includes(a)) || queryTerms.some((t) => tags.includes(t))) {
      highestScore = Math.max(highestScore, 0.75);
      bestReason = `Tag match in lead metadata`;
      continue;
    }

    // 4. Token match in name or category
    const allTerms = [indName, ...aliases, ...queryTerms].join(" ").split(/\s+/);
    const distinctiveTokens = Array.from(new Set(allTerms)).filter((t) => t.length > 3);

    let tokenMatches = 0;
    for (const tok of distinctiveTokens) {
      if (name.includes(tok) || category.includes(tok)) {
        tokenMatches++;
      }
    }

    if (tokenMatches > 0) {
      const tokenScore = Math.min(0.5 + tokenMatches * 0.1, 0.7);
      if (tokenScore > highestScore) {
        highestScore = tokenScore;
        bestReason = `Partial token match (${tokenMatches} tokens)`;
      }
    }
  }

  // Exclusion Check: If lead has an explicitly unrelated category (e.g. searched "dentist" but got "restaurant")
  const isExcluded = isExplicitlyContradictory(category, targetIndustries);
  if (isExcluded) {
    return { score: 0.1, isRelevant: false, matchReason: `Contradictory category: ${category}` };
  }

  const isRelevant = highestScore >= 0.40;
  return {
    score: highestScore,
    isRelevant,
    matchReason: bestReason,
  };
}

/**
 * Evaluates the relevance of an online job lead against target industries.
 */
export function scoreOnlineJobRelevance(
  job: OnlineJobLead,
  targetIndustries: IndustryDefinition[],
  rawQuery: string
): RelevanceScoreResult {
  if (!job) {
    return { score: 0, isRelevant: false, matchReason: "Empty job" };
  }

  const title = (job.title || "").toLowerCase();
  const desc = (job.descriptionSnippet || "").toLowerCase();
  const tags = (job.tags || []).join(" ").toLowerCase();

  if (!targetIndustries || targetIndustries.length === 0) {
    const q = rawQuery.toLowerCase().trim();
    if (!q) return { score: 1.0, isRelevant: true, matchReason: "All jobs accepted" };

    if (title.includes(q)) {
      return { score: 0.95, isRelevant: true, matchReason: "Direct title match" };
    }
    if (tags.includes(q) || desc.includes(q)) {
      return { score: 0.75, isRelevant: true, matchReason: "Description / tag match" };
    }

    const tokens = q.split(/\s+/).filter((t) => t.length > 2);
    const matchesToken = tokens.some((t) => title.includes(t) || tags.includes(t));
    if (matchesToken) {
      return { score: 0.65, isRelevant: true, matchReason: "Partial query match" };
    }

    return { score: 0.3, isRelevant: false, matchReason: "No query match" };
  }

  let highestScore = 0;
  let bestReason = "Unrelated job role";

  for (const ind of targetIndustries) {
    const titles = ind.jobTerms.titles.map((t) => t.toLowerCase());
    const keywords = ind.jobTerms.keywords.map((k) => k.toLowerCase());
    const aliases = ind.aliases.map((a) => a.toLowerCase());

    // 1. Title match with canonical job titles
    if (titles.some((t) => title.includes(t)) || aliases.some((a) => title.includes(a))) {
      highestScore = Math.max(highestScore, 0.95);
      bestReason = `Job title match: ${job.title}`;
      continue;
    }

    // 2. Tech stack / keyword match in tags or title
    if (keywords.some((k) => title.includes(k) || tags.includes(k))) {
      highestScore = Math.max(highestScore, 0.85);
      bestReason = `Keyword match in title/tags`;
      continue;
    }

    // 3. Keyword match in snippet
    if (keywords.some((k) => desc.includes(k))) {
      highestScore = Math.max(highestScore, 0.70);
      bestReason = `Keyword match in job description`;
      continue;
    }
  }

  const isRelevant = highestScore >= 0.45;
  return {
    score: highestScore,
    isRelevant,
    matchReason: bestReason,
  };
}

/**
 * Checks for known severe cross-category contradictions.
 */
function isExplicitlyContradictory(category: string, targetIndustries: IndustryDefinition[]): boolean {
  if (!category) return false;

  const targetCategoryIds = new Set(targetIndustries.map((i) => i.categoryId));

  // If user searched for medical/dentistry but result is food/restaurant
  if (targetCategoryIds.has("healthcare") && (category.includes("restaurant") || category.includes("cafe") || category.includes("bar"))) {
    return true;
  }

  // If user searched for automotive/repair but result is bakery/food
  if (targetCategoryIds.has("automotive") && (category.includes("bakery") || category.includes("restaurant") || category.includes("cafe"))) {
    return true;
  }

  // If user searched for legal/accounting but result is car repair
  if (targetCategoryIds.has("professional_services") && (category.includes("car_repair") || category.includes("plumber"))) {
    return true;
  }

  return false;
}
