export type RegionalEligibilityBadge =
  | "kenya_eligible"
  | "worldwide"
  | "regional_restricted"
  | "country_restricted"
  | "language_restricted"
  | "qualification_restricted"
  | "assessment_required"
  | "eligibility_not_specified"
  | "requires_verification"
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
 * Deterministically checks whether a remote job/AI task listing accepts applicants from Kenya / East Africa / Africa,
 * or requires country, language, or assessment qualifications.
 */
export function checkApplicantEligibility(job: {
  location?: string | null;
  remoteType?: string | null;
  descriptionSnippet?: string | null;
  title?: string | null;
  source?: string | null;
  countryEligibility?: string | null;
  assessmentRequired?: boolean | null;
  qualificationRequired?: boolean | null;
}): EligibilityResult {
  const loc = (job.location || "").toLowerCase().trim();
  const snippet = (job.descriptionSnippet || "").toLowerCase();
  const remoteType = (job.remoteType || "").toLowerCase();
  const title = (job.title || "").toLowerCase();
  const fullText = `${loc} ${snippet} ${remoteType} ${title}`.toLowerCase();
  const countryElig = job.countryEligibility || "";

  const reasons: string[] = [];

  // Explicit AI eligibility override if set by connector
  if (countryElig === "country_restricted") {
    reasons.push("Explicitly restricted to specific qualifying countries by source platform");
    return {
      isEligibleKenya: false,
      badgeText: "Country Restricted",
      badgeType: "country_restricted",
      timezoneOverlapHours: 3,
      confidence: "Verified",
      reasons,
    };
  }

  if (countryElig === "language_restricted") {
    reasons.push("Restricted to native speakers of specific target language pairs");
    return {
      isEligibleKenya: false,
      badgeText: "Language Restricted",
      badgeType: "language_restricted",
      timezoneOverlapHours: 6,
      confidence: "Verified",
      reasons,
    };
  }

  if (countryElig === "assessment_required" || job.assessmentRequired === true) {
    if (fullText.includes("kenya") || fullText.includes("worldwide") || fullText.includes("anywhere")) {
      reasons.push("Assessment test required prior to project assignment; accepts applicants globally");
      return {
        isEligibleKenya: true,
        badgeText: "Assessment Required",
        badgeType: "assessment_required",
        timezoneOverlapHours: 7,
        confidence: "Verified",
        reasons,
      };
    }
  }

  // 1. Direct explicit Kenya / East Africa / Africa mentions
  if (
    loc.includes("kenya") ||
    loc.includes("nairobi") ||
    loc.includes("east africa") ||
    loc.includes("sub-saharan") ||
    loc.includes("africa") ||
    countryElig === "kenya_eligible" ||
    job.source === "africa"
  ) {
    reasons.push("Directly specifies Kenya or African regional applicant eligibility");
    return {
      isEligibleKenya: true,
      badgeText: "Eligible: Kenya",
      badgeType: "kenya_eligible",
      timezoneOverlapHours: 8,
      confidence: "Verified",
      reasons,
    };
  }

  // 2. Language-restricted roles (e.g. Portuguese (Brazil), German, French Canadian, Japanese)
  const isLanguageRestricted =
    /(portuguese\s*\(?\s*brazil\s*\)?|french\s+canadian|native\s+german|japanese\s+speaker|korean\s+speaker|native\s+danish|native\s+norwegian)/i.test(fullText);

  if (isLanguageRestricted) {
    reasons.push("Role requires native fluency in specific localized language not standard in East Africa");
    return {
      isEligibleKenya: false,
      badgeText: "Language Restricted",
      badgeType: "language_restricted",
      timezoneOverlapHours: 6,
      confidence: "High",
      reasons,
    };
  }

  // 3. Explicit geographic restrictions (e.g. US Only, North America Only, EU/UK Only)
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

  // 4. EMEA / Global Remote / Worldwide / Anywhere
  const isWorldwide =
    countryElig === "worldwide" ||
    loc.includes("worldwide") ||
    loc.includes("anywhere") ||
    loc.includes("global") ||
    remoteType === "worldwide" ||
    snippet.includes("work from anywhere") ||
    snippet.includes("worldwide remote");

  const isEmea = loc.includes("emea") || fullText.includes("emea");

  if (isEmea) {
    reasons.push("EMEA (Europe, Middle East, Africa) includes East Africa with working hour alignment");
    return {
      isEligibleKenya: true,
      badgeText: "Eligible: EMEA",
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
      badgeText: "Worldwide Remote",
      badgeType: "worldwide",
      timezoneOverlapHours: 6,
      confidence: "High",
      reasons,
    };
  }

  // 5. Unspecified eligibility
  if (!loc || loc === "remote" || loc === "remote - worldwide" || countryElig === "eligibility_not_specified") {
    return {
      isEligibleKenya: true,
      badgeText: "Eligibility Not Specified",
      badgeType: "eligibility_not_specified",
      timezoneOverlapHours: 5,
      confidence: "Medium",
      reasons: ["Location requirements not explicitly specified by source; review job posting"],
    };
  }

  // 6. Default / Timezone overlap
  return {
    isEligibleKenya: true,
    badgeText: "Remote (Check Posting)",
    badgeType: "timezone_overlap",
    timezoneOverlapHours: 5,
    confidence: "Medium",
    reasons: ["General remote role without explicit region disqualifiers"],
  };
}
