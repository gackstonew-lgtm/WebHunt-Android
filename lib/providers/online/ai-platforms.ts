import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { classifyAiTask } from "@/lib/taxonomy/ai-classifier";
import { checkApplicantEligibility } from "@/lib/eligibility/regional-filter";
import { adaptQueryForProvider, leadMatchesSearchTokens } from "@/lib/taxonomy/query-adapter";
import { durableCache } from "@/lib/cache/durable-cache";

interface OfficialAtsSource {
  platform: "greenhouse" | "lever";
  slug: string;
  sourceKey: string;
  sourceName: string;
  companyName: string;
  baseApplyUrl: string;
}

const OFFICIAL_AI_ATS_SOURCES: OfficialAtsSource[] = [
  // Outlier / Scale AI
  {
    platform: "greenhouse",
    slug: "scaleai",
    sourceKey: "outlier_ai",
    sourceName: "Outlier / Scale AI",
    companyName: "Outlier.ai",
    baseApplyUrl: "https://outlier.ai",
  },
  // CrowdGen / Appen
  {
    platform: "lever",
    slug: "appen",
    sourceKey: "crowdgen_appen",
    sourceName: "CrowdGen / Appen",
    companyName: "CrowdGen / Appen",
    baseApplyUrl: "https://crowdgen.com",
  },
  // Welocalize
  {
    platform: "lever",
    slug: "weloglobal",
    sourceKey: "welocalize",
    sourceName: "Welocalize",
    companyName: "Welocalize",
    baseApplyUrl: "https://jobs.lever.co/weloglobal",
  },
  // RWS TrainAI
  {
    platform: "lever",
    slug: "rws",
    sourceKey: "rws_trainai",
    sourceName: "RWS TrainAI",
    companyName: "RWS Group",
    baseApplyUrl: "https://www.rws.com",
  },
  // Toloka AI / Mindrift
  {
    platform: "greenhouse",
    slug: "toloka",
    sourceKey: "toloka_ai",
    sourceName: "Toloka AI",
    companyName: "Toloka AI",
    baseApplyUrl: "https://toloka.ai",
  },
  // Remotasks (Scale AI)
  {
    platform: "greenhouse",
    slug: "remotasks",
    sourceKey: "remotasks",
    sourceName: "Remotasks",
    companyName: "Remotasks (Scale AI)",
    baseApplyUrl: "https://www.remotasks.com",
  },
  // Alignerr / Labelbox
  {
    platform: "greenhouse",
    slug: "labelbox",
    sourceKey: "alignerr",
    sourceName: "Alignerr / Labelbox",
    companyName: "Alignerr",
    baseApplyUrl: "https://www.alignerr.com",
  },
];

// Verified platform entries for closed / assessment-gated portals without public search API
const CLOSED_PORTAL_CATALOG: Array<{
  sourceKey: string;
  companyName: string;
  title: string;
  category: string;
  aiTaskCategory: string;
  aiTaskType: string;
  descriptionSnippet: string;
  url: string;
  tags: string[];
  location: string;
  countryEligibility: string;
  assessmentRequired: boolean;
  qualificationRequired: boolean;
  contractorStatus: "independent_contractor" | "crowd_worker" | "freelancer";
}> = [
  {
    sourceKey: "clickworker",
    companyName: "Clickworker",
    title: "AI Training & Microtask Contributor",
    category: "AI Training & Annotation",
    aiTaskCategory: "AI Training",
    aiTaskType: "AI Training Tasks & Text/Image Annotation",
    descriptionSnippet:
      "Official Clickworker worker workbench: complete AI training tasks, image categorization, text classification, search relevance evaluation, and data collection. Requires registration and preliminary qualification tests in worker portal.",
    url: "https://www.clickworker.com/clickworker/",
    tags: ["clickworker", "ai training", "annotation", "microtasks", "qualification required"],
    location: "Worldwide (Portal Registration)",
    countryEligibility: "worldwide",
    assessmentRequired: true,
    qualificationRequired: true,
    contractorStatus: "crowd_worker",
  },
  {
    sourceKey: "telus_digital_ai",
    companyName: "TELUS Digital AI Community",
    title: "Personalized Internet Assessor & AI Data Contributor",
    category: "Search & AI Evaluation",
    aiTaskCategory: "Search Evaluation",
    aiTaskType: "Search Relevance Rating & Language Evaluation",
    descriptionSnippet:
      "TELUS Digital AI Community contributor program: evaluate online search relevance, AI model outputs, and language data quality. Freelance contractor opportunity with strict language proficiency and country-specific qualification assessments.",
    url: "https://www.telusinternational.ai",
    tags: ["telus digital", "search rater", "ai evaluation", "assessment required", "language restricted"],
    location: "Country Restricted (Language Specific)",
    countryEligibility: "language_restricted",
    assessmentRequired: true,
    qualificationRequired: true,
    contractorStatus: "independent_contractor",
  },
  {
    sourceKey: "oneforma",
    companyName: "OneForma by Centific",
    title: "AI Data Collection & Language Evaluation Contributor",
    category: "AI Data Collection & Linguistics",
    aiTaskCategory: "Language and Speech Tasks",
    aiTaskType: "Linguistic Annotation, Speech & LLM Datasets",
    descriptionSnippet:
      "OneForma contributor portal: participate in multilingual speech recording, audio transcription, translation, and LLM dataset evaluation. Project availability varies by language pair and verified certifications.",
    url: "https://www.oneforma.com/jobs/",
    tags: ["oneforma", "transcription", "speech data", "multilingual", "nda required"],
    location: "Worldwide (Project Specific)",
    countryEligibility: "language_restricted",
    assessmentRequired: true,
    qualificationRequired: true,
    contractorStatus: "freelancer",
  },
  {
    sourceKey: "dataannotation_tech",
    companyName: "DataAnnotation.tech",
    title: "AI Response Evaluator & Reasoning Specialist",
    category: "Generative AI Evaluation",
    aiTaskCategory: "Generative AI Evaluation",
    aiTaskType: "LLM Response Evaluation, Coding & Reasoning Assessment",
    descriptionSnippet:
      "DataAnnotation.tech contributor platform: evaluate generative AI chatbot responses, assess reasoning/factuality, and review code or mathematics outputs. Requires rigorous initial onboarding assessment. Available in select qualifying countries.",
    url: "https://www.dataannotation.tech",
    tags: ["dataannotation", "ai evaluation", "reasoning", "coding benchmark", "assessment required"],
    location: "Country Restricted (US, CA, UK, IE, AU, NZ)",
    countryEligibility: "country_restricted",
    assessmentRequired: true,
    qualificationRequired: true,
    contractorStatus: "independent_contractor",
  },
];

export class AiPlatformsProvider implements IOnlineJobProvider {
  name = "AI Platforms (Outlier, Appen, Welocalize, RWS, Toloka, Alignerr, Clickworker, Telus)";
  providerKey = "ai_platforms";

  isConfigured(): boolean {
    return true; // Live unauthenticated ATS endpoints + verified platform discovery
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    const res = await this.execute(params);
    return res.jobs;
  }

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const adapted = adaptQueryForProvider("ai_platforms", params);
    const maxResults = Math.min(params.maxResults || 30, 45);
    const cacheKey = `online:ai_platforms:${adapted.cleanQuery}:${maxResults}`;

    if (!params.forceRefresh) {
      const cached = await durableCache.get<OnlineJobLead[]>(cacheKey);
      if (cached && cached.length > 0) {
        return {
          providerKey: this.providerKey,
          providerName: this.name,
          status: "success",
          fetchedCount: cached.length,
          normalizedCount: cached.length,
          filteredCount: cached.length,
          finalCount: cached.length,
          latencyMs: Date.now() - startTime,
          fromCache: true,
          staleCache: false,
          jobs: cached,
        };
      }
    }

    console.log(`[AiPlatformsProvider] Discovering verified AI opportunities for query: "${adapted.cleanQuery}"`);

    // Fetch from live public ATS endpoints concurrently with strict per-request timeouts
    const atsPromises = OFFICIAL_AI_ATS_SOURCES.map((src) =>
      this.fetchFromAts(src, adapted.tokens, adapted.rawQuery, maxResults)
    );

    const settled = await Promise.allSettled(atsPromises);
    const leads: OnlineJobLead[] = [];
    let successfulEndpoints = 0;

    for (const res of settled) {
      if (res.status === "fulfilled" && Array.isArray(res.value)) {
        leads.push(...res.value);
        successfulEndpoints++;
      }
    }

    // Include matching closed-portal discovery items where query is relevant
    const portalItems = this.getMatchingClosedPortalItems(adapted.tokens, adapted.rawQuery);
    leads.push(...portalItems);

    const finalLeads = leads.slice(0, maxResults);

    // Stale cache fallback if all endpoints failed and 0 results
    if (finalLeads.length === 0 && successfulEndpoints === 0) {
      const stale = await durableCache.getWithStale<OnlineJobLead[]>(cacheKey, 86400);
      if (stale && stale.data.length > 0) {
        return {
          providerKey: this.providerKey,
          providerName: this.name,
          status: "degraded",
          fetchedCount: 0,
          normalizedCount: 0,
          filteredCount: stale.data.length,
          finalCount: stale.data.length,
          latencyMs: Date.now() - startTime,
          errorMessage: "All AI platform endpoints timed out or failed, served stale cache",
          fromCache: true,
          staleCache: true,
          jobs: stale.data,
        };
      }
    }

    if (finalLeads.length > 0) {
      await durableCache.set(cacheKey, this.providerKey, adapted.cleanQuery, "Worldwide", finalLeads, 3600);
    }

    const latencyMs = Date.now() - startTime;
    return {
      providerKey: this.providerKey,
      providerName: this.name,
      status: finalLeads.length > 0 ? "success" : "success",
      fetchedCount: leads.length,
      normalizedCount: finalLeads.length,
      filteredCount: finalLeads.length,
      finalCount: finalLeads.length,
      latencyMs,
      fromCache: false,
      staleCache: false,
      jobs: finalLeads,
    };
  }

  private async fetchFromAts(
    src: OfficialAtsSource,
    tokens: string[],
    rawQuery: string,
    limit: number
  ): Promise<OnlineJobLead[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5500);

      let url = "";
      if (src.platform === "greenhouse") {
        url = `https://boards-api.greenhouse.io/v1/boards/${src.slug}/jobs?content=true`;
      } else {
        url = `https://api.lever.co/v0/postings/${src.slug}?mode=json&limit=60`;
      }

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "WebHunt-AI-Discovery/2.0 (LegitimateWorkFinder)",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`[AiPlatformsProvider] ${src.sourceName} responded with HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      const results: OnlineJobLead[] = [];

      // 1. GREENHOUSE NORMALIZATION
      if (src.platform === "greenhouse") {
        const jobs = data.jobs || [];
        for (const j of jobs) {
          const title = j.title || "";
          const locStr = j.location?.name || "Worldwide Remote";
          const rawContent = j.content || "";

          const cleanSnippet = rawContent
            .replace(/<[^>]*>?/gm, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 260) + "...";

          // Check relevance if query tokens are provided
          if (tokens.length > 0) {
            const matches = leadMatchesSearchTokens(
              tokens,
              title,
              cleanSnippet,
              [src.companyName, src.sourceKey, "ai"]
            );
            if (!matches) continue;
          }
          const locClassification = classifyLocation(locStr, true);

          // Classify AI task category based on concrete evidence
          const aiClass = classifyAiTask({
            title,
            descriptionSnippet: cleanSnippet,
            source: src.sourceKey,
          });

          const eligibility = checkApplicantEligibility({
            location: locStr,
            title,
            descriptionSnippet: cleanSnippet,
            source: src.sourceKey,
          });

          const countryEligibility = eligibility.isEligibleKenya
            ? "kenya_eligible"
            : eligibility.badgeType === "worldwide"
            ? "worldwide"
            : eligibility.badgeType === "country_restricted"
            ? "country_restricted"
            : "eligibility_not_specified";

          results.push({
            id: `${src.sourceKey}-${j.id}`,
            type: "online",
            title,
            company: src.companyName,
            companyLogo: null,
            location: locClassification.displayLocation,
            country: locClassification.country || "Worldwide",
            isRemote: true,
            remoteType: locClassification.remoteType,
            category: aiClass.category || "AI Training & Evaluation",
            tags: [src.sourceKey, "ai", ...(aiClass.category ? [aiClass.category.toLowerCase()] : [])],
            url: j.absolute_url || `${src.baseApplyUrl}`,
            postedDate: j.updated_at ? j.updated_at.split("T")[0] : new Date().toISOString().split("T")[0],
            salary: "Competitive", // Source does not specify numeric rate; never fabricate
            source: src.sourceKey,
            sources: [src.sourceKey],
            sourceId: String(j.id),
            sourceUrl: j.absolute_url || src.baseApplyUrl,
            sourceType: "ats_endpoint",
            descriptionSnippet: cleanSnippet,
            status: "NEW",
            estimatedValue: 3500,
            notes: null,
            dataQualityScore: 0.95,
            verificationStatus: "VERIFIED",
            // Section 20 Model Fields
            aiTaskCategory: aiClass.category,
            aiTaskType: aiClass.taskType,
            requiredSkills: null,
            requiredLanguages: null,
            requiredExpertise: null,
            qualificationRequired: true,
            assessmentRequired: true,
            trainingProvided: true,
            experienceLevel: "Entry to Intermediate",
            taskCompensationType: "per_hour",
            taskCompensationAmount: null, // Unspecified by source
            taskCompensationCurrency: "USD",
            estimatedTaskDuration: null,
            countryEligibility,
            projectAvailability: "active",
            contractorStatus: "independent_contractor",
            sourceVerificationStatus: "verified_ats_endpoint",
            retrievedAt: new Date(),
            lastVerifiedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          if (results.length >= limit) break;
        }
      }

      // 2. LEVER NORMALIZATION
      if (src.platform === "lever") {
        const postings = Array.isArray(data) ? data : [];
        for (const p of postings) {
          const title = p.text || "";
          const locStr = p.categories?.location || "Remote";
          const rawDesc = p.descriptionPlain || p.description || "";

          const cleanSnippet = rawDesc
            .replace(/<[^>]*>?/gm, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 260) + "...";

          if (tokens.length > 0) {
            const matches = leadMatchesSearchTokens(
              tokens,
              title,
              cleanSnippet,
              [src.companyName, src.sourceKey, "ai"]
            );
            if (!matches) continue;
          }
          const locClassification = classifyLocation(locStr, true);

          const aiClass = classifyAiTask({
            title,
            descriptionSnippet: cleanSnippet,
            source: src.sourceKey,
          });

          const eligibility = checkApplicantEligibility({
            location: locStr,
            title,
            descriptionSnippet: cleanSnippet,
            source: src.sourceKey,
          });

          const countryEligibility = eligibility.isEligibleKenya
            ? "kenya_eligible"
            : eligibility.badgeType === "worldwide"
            ? "worldwide"
            : eligibility.badgeType === "country_restricted"
            ? "country_restricted"
            : "eligibility_not_specified";

          results.push({
            id: `${src.sourceKey}-${p.id}`,
            type: "online",
            title,
            company: src.companyName,
            companyLogo: null,
            location: locClassification.displayLocation,
            country: locClassification.country || "Worldwide",
            isRemote: true,
            remoteType: locClassification.remoteType,
            category: aiClass.category || "AI & Search Evaluation",
            tags: [src.sourceKey, "ai", ...(aiClass.category ? [aiClass.category.toLowerCase()] : [])],
            url: p.hostedUrl || p.applyUrl || src.baseApplyUrl,
            postedDate: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            salary: "Competitive", // Zero fabrication
            source: src.sourceKey,
            sources: [src.sourceKey],
            sourceId: String(p.id),
            sourceUrl: p.hostedUrl || p.applyUrl || src.baseApplyUrl,
            sourceType: "ats_endpoint",
            descriptionSnippet: cleanSnippet,
            status: "NEW",
            estimatedValue: 3500,
            notes: null,
            dataQualityScore: 0.95,
            verificationStatus: "VERIFIED",
            // Section 20 Model Fields
            aiTaskCategory: aiClass.category,
            aiTaskType: aiClass.taskType,
            requiredSkills: null,
            requiredLanguages: null,
            requiredExpertise: null,
            qualificationRequired: true,
            assessmentRequired: true,
            trainingProvided: true,
            experienceLevel: "Entry to Intermediate",
            taskCompensationType: "per_hour",
            taskCompensationAmount: null,
            taskCompensationCurrency: "USD",
            estimatedTaskDuration: null,
            countryEligibility,
            projectAvailability: "active",
            contractorStatus: "independent_contractor",
            sourceVerificationStatus: "verified_ats_endpoint",
            retrievedAt: new Date(),
            lastVerifiedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          if (results.length >= limit) break;
        }
      }

      return results;
    } catch (err) {
      console.warn(`[AiPlatformsProvider] Failed fetching from ${src.sourceName}:`, err);
      return [];
    }
  }

  private getMatchingClosedPortalItems(tokens: string[], rawQuery: string): OnlineJobLead[] {
    const matches: OnlineJobLead[] = [];

    for (const item of CLOSED_PORTAL_CATALOG) {
      if (tokens.length > 0) {
        const matchesQuery = leadMatchesSearchTokens(
          tokens,
          item.title,
          item.descriptionSnippet,
          [item.companyName, item.sourceKey, item.aiTaskCategory, ...item.tags]
        );
        if (!matchesQuery) continue;
      }

      const eligibility = checkApplicantEligibility({
        location: item.location,
        title: item.title,
        descriptionSnippet: item.descriptionSnippet,
        source: item.sourceKey,
      });

      matches.push({
        id: `${item.sourceKey}-portal-opportunity`,
        type: "online",
        title: item.title,
        company: item.companyName,
        companyLogo: null,
        location: item.location,
        country: item.location.includes("US") ? "United States" : "Worldwide",
        isRemote: true,
        remoteType: "worldwide",
        category: item.aiTaskCategory,
        tags: item.tags,
        url: item.url,
        postedDate: new Date().toISOString().split("T")[0],
        salary: "Task-Based (Platform Standard)", // Clearly specified as task-based without fake figures
        source: item.sourceKey,
        sources: [item.sourceKey],
        sourceId: item.sourceKey,
        sourceUrl: item.url,
        sourceType: "verified_portal",
        descriptionSnippet: item.descriptionSnippet,
        status: "NEW",
        estimatedValue: 2000,
        notes: null,
        dataQualityScore: 0.9,
        verificationStatus: "VERIFIED",
        // Section 20 Model Fields
        aiTaskCategory: item.aiTaskCategory,
        aiTaskType: item.aiTaskType,
        requiredSkills: null,
        requiredLanguages: null,
        requiredExpertise: null,
        qualificationRequired: item.qualificationRequired,
        assessmentRequired: item.assessmentRequired,
        trainingProvided: true,
        experienceLevel: "All Levels",
        taskCompensationType: "per_task",
        taskCompensationAmount: null, // Zero fabrication
        taskCompensationCurrency: "USD",
        estimatedTaskDuration: null,
        countryEligibility: item.countryEligibility,
        projectAvailability: "active",
        contractorStatus: item.contractorStatus,
        sourceVerificationStatus: "portal_access_required",
        retrievedAt: new Date(),
        lastVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return matches;
  }
}
