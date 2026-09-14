import { PhysicalLead, OnlineJobLead } from "../types";
import { IndustryDefinition } from "../taxonomy/types";
import { checkApplicantEligibility } from "../eligibility/regional-filter";

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
 * Multi-Factor Ranking Engine for Online Job Opportunities.
 * 1. Role Relevance (0-40 pts)
 * 2. Geographic Eligibility & Remote Realism (0-25 pts)
 * 3. Recency & Freshness (0-15 pts)
 * 4. Information Completeness & Salary Transparency (0-10 pts)
 * 5. Source Quality & Verification Tier (0-10 pts)
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
  const q = (rawQuery || "").toLowerCase().trim();

  // 1. Role Relevance (0 - 40 points)
  let rolePoints = 15; // baseline
  let matchReason = "Generic remote listing";

  if (!targetIndustries || targetIndustries.length === 0) {
    if (q && title.includes(q)) {
      rolePoints = 40;
      matchReason = `Direct title match: "${q}"`;
    } else if (q && (tags.includes(q) || desc.includes(q))) {
      rolePoints = 32;
      matchReason = `Keyword match in tags or description: "${q}"`;
    } else if (q) {
      const tokens = q.split(/\s+/).filter((t) => t.length > 2);
      const matchedTokens = tokens.filter((t) => title.includes(t) || tags.includes(t));
      if (matchedTokens.length > 0) {
        rolePoints = 25;
        matchReason = `Partial token match: ${matchedTokens.join(", ")}`;
      }
    } else {
      rolePoints = 30;
      matchReason = "General remote role";
    }
  } else {
    for (const ind of targetIndustries) {
      const titles = ind.jobTerms.titles.map((t) => t.toLowerCase());
      const keywords = ind.jobTerms.keywords.map((k) => k.toLowerCase());
      const aliases = ind.aliases.map((a) => a.toLowerCase());

      if (titles.some((t) => title.includes(t)) || aliases.some((a) => title.includes(a))) {
        rolePoints = Math.max(rolePoints, 40);
        matchReason = `Direct role title match: ${job.title}`;
        continue;
      }

      if (keywords.some((k) => title.includes(k) || tags.includes(k))) {
        rolePoints = Math.max(rolePoints, 34);
        matchReason = `Technology/keyword match in title or skills`;
        continue;
      }

      if (keywords.some((k) => desc.includes(k))) {
        rolePoints = Math.max(rolePoints, 28);
        matchReason = `Keyword match in job description`;
        continue;
      }
    }
  }

  // 2. Geographic Eligibility & Remote Realism (0 - 25 points)
  let geoPoints = 15;
  const eligibility = checkApplicantEligibility({
    location: job.location,
    remoteType: job.remoteType,
    descriptionSnippet: job.descriptionSnippet,
    title: job.title,
    source: job.source,
  });

  if (eligibility.badgeType === "kenya_eligible") {
    geoPoints = 25;
  } else if (eligibility.badgeType === "worldwide") {
    geoPoints = 22;
  } else if (eligibility.badgeType === "timezone_overlap") {
    geoPoints = 17;
  } else if (eligibility.badgeType === "country_restricted" || eligibility.badgeType === "regional_restricted") {
    geoPoints = 5;
  }

  // 3. Recency & Freshness (0 - 15 points)
  let recencyPoints = 8;
  if (job.postedDate) {
    try {
      const ageMs = Date.now() - new Date(job.postedDate).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays <= 1) recencyPoints = 15;
      else if (ageDays <= 7) recencyPoints = 12;
      else if (ageDays <= 14) recencyPoints = 9;
      else if (ageDays <= 30) recencyPoints = 6;
      else recencyPoints = 2;
    } catch {
      recencyPoints = 8;
    }
  }

  // 4. Information Completeness & Salary Transparency (0 - 10 points)
  let infoPoints = 0;
  if (job.salary && job.salary !== "Competitive" && job.salary !== "Not specified") {
    infoPoints += 6;
  }
  if (job.descriptionSnippet && job.descriptionSnippet.length > 80) {
    infoPoints += 2;
  }
  if (job.tags && job.tags.length > 0) {
    infoPoints += 2;
  }

  // 5. Source Quality & Verification Tier (0 - 10 points)
  let sourcePoints = 6;
  const src = (job.source || "").toLowerCase();
  if (
    src === "greenhouse" || 
    src === "lever" || 
    src === "ashby" || 
    src === "ats" ||
    src === "ai_platforms" ||
    src === "outlier_ai" ||
    src === "crowdgen_appen" ||
    src === "welocalize" ||
    src === "rws_trainai" ||
    src === "toloka_ai" ||
    src === "alignerr" ||
    src === "remotasks" ||
    src === "clickworker" ||
    src === "telus_digital_ai" ||
    src === "oneforma" ||
    src === "dataannotation_tech"
  ) {
    sourcePoints = 10; // Direct Employer ATS & Verified AI Work Platforms
  } else if (src === "himalayas" || src === "weworkremotely" || src === "remotive" || src === "arbeitnow") {
    sourcePoints = 8; // Verified Direct Remote Boards
  } else {
    sourcePoints = 6;
  }

  const totalPoints = rolePoints + geoPoints + recencyPoints + infoPoints + sourcePoints;
  const normalizedScore = Math.min(1.0, Math.max(0.1, Math.round(totalPoints) / 100));

  // Lead is relevant if role matched or total score is respectable
  const isRelevant = totalPoints >= 35;

  return {
    score: normalizedScore,
    isRelevant,
    matchReason,
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
