export type RegionalEligibilityBadge =
  | "kenya_eligible"
  | "worldwide"
  | "regional_restricted"
  | "country_restricted"
  | "timezone_overlap";

export interface EligibilityResult {
  isEligibleKenya: boolean;
  badgeText: string;
  badgeType: RegionalEligibilityBadge;
  timezoneOverlapHours: number; // Approximate daily overlap with EAT (UTC+3)
  confidence: "High" | "Medium" | "Verified";
  reasons: string[];
}

/**
 * Deterministically checks whether a remote job listing accepts applicants from Kenya / East Africa / Africa,
 * and computes daily working hour overlap with East Africa Time (EAT, UTC+3).
 */
export function checkApplicantEligibility(job: {
  location?: string | null;
  remoteType?: string | null;
  descriptionSnippet?: string | null;
  title?: string | null;
  source?: string | null;
}): EligibilityResult {
  const loc = (job.location || "").toLowerCase().trim();
  const snippet = (job.descriptionSnippet || "").toLowerCase();
  const remoteType = (job.remoteType || "").toLowerCase();
  const fullText = `${loc} ${snippet} ${remoteType} ${job.title || ""}`.toLowerCase();

  const reasons: string[] = [];

  // 1. Direct explicit Kenya / East Africa / Africa mentions
  if (
    loc.includes("kenya") ||
    loc.includes("nairobi") ||
    loc.includes("east africa") ||
    loc.includes("sub-saharan") ||
    loc.includes("africa") ||
    job.source === "africa"
  ) {
    reasons.push("Directly specifies Kenya or African regional applicant eligibility");
    return {
      isEligibleKenya: true,
      badgeText: "Eligible: Kenya & East Africa",
      badgeType: "kenya_eligible",
      timezoneOverlapHours: 8,
      confidence: "Verified",
      reasons,
    };
  }

  // 2. Explicit restrictions (e.g. US Only, North America Only, EU/UK Only, Citizenship / Visa required)
  const isUsOnly =
    loc.includes("us only") ||
    loc.includes("usa only") ||
    loc.includes("united states only") ||
    loc.includes("must be based in the us") ||
    loc.includes("us citizen") ||
    loc.includes("us residence") ||
    snippet.includes("us work authorization required") ||
    snippet.includes("must reside in the united states") ||
    snippet.includes("w2 only");

  const isEuOnly =
    loc.includes("eu only") ||
    loc.includes("europe only") ||
    loc.includes("uk only") ||
    loc.includes("germany only") ||
    loc.includes("must reside in the european union") ||
    snippet.includes("eu citizenship required");

  const isCanadaOnly = loc.includes("canada only") || loc.includes("must reside in canada");

  const isLatamOnly = loc.includes("latam only") || loc.includes("latin america only");

  const isApecOnly = loc.includes("apac only") || loc.includes("australia only");

  if (isUsOnly) {
    reasons.push("Restricted to US residents / citizens (W2 or US work authorization required)");
    return {
      isEligibleKenya: false,
      badgeText: "US Only (Restricted)",
      badgeType: "country_restricted",
      timezoneOverlapHours: 3,
      confidence: "High",
      reasons,
    };
  }

  if (isEuOnly) {
    reasons.push("Restricted to European Union / UK resident applicants");
    return {
      isEligibleKenya: false,
      badgeText: "EU/UK Only (Restricted)",
      badgeType: "country_restricted",
      timezoneOverlapHours: 7,
      confidence: "High",
      reasons,
    };
  }

  if (isCanadaOnly || isLatamOnly || isApecOnly) {
    reasons.push("Restricted to specific non-African geographic zone");
    return {
      isEligibleKenya: false,
      badgeText: "Geographic Restricted",
      badgeType: "country_restricted",
      timezoneOverlapHours: 4,
      confidence: "High",
      reasons,
    };
  }

  // 3. EMEA / Global Remote / Worldwide / Anywhere
  const isWorldwide =
    loc.includes("worldwide") ||
    loc.includes("anywhere") ||
    loc.includes("global") ||
    loc.includes("remote") ||
    loc === "" ||
    remoteType === "worldwide" ||
    snippet.includes("work from anywhere") ||
    snippet.includes("worldwide remote");

  const isEmea = loc.includes("emea") || fullText.includes("emea");

  if (isEmea) {
    reasons.push("EMEA (Europe, Middle East, Africa) includes East Africa with nearly 100% working hour alignment");
    return {
      isEligibleKenya: true,
      badgeText: "Eligible: EMEA (UTC+3 Aligned)",
      badgeType: "kenya_eligible",
      timezoneOverlapHours: 7,
      confidence: "High",
      reasons,
    };
  }

  if (isWorldwide) {
    reasons.push("Worldwide / Global Remote position accepting applicants globally");
    return {
      isEligibleKenya: true,
      badgeText: "Worldwide Remote (Eligible)",
      badgeType: "worldwide",
      timezoneOverlapHours: 6,
      confidence: "High",
      reasons,
    };
  }

  // 4. Default / Timezone overlap
  return {
    isEligibleKenya: true,
    badgeText: "Remote (Check Posting)",
    badgeType: "timezone_overlap",
    timezoneOverlapHours: 5,
    confidence: "Medium",
    reasons: ["General remote role without explicit region disqualifiers"],
  };
}
