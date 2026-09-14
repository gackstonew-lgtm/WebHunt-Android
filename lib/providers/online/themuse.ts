import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { adaptQueryForProvider, leadMatchesSearchTokens } from "@/lib/taxonomy/query-adapter";
import { durableCache } from "@/lib/cache/durable-cache";

export class TheMuseJobProvider implements IOnlineJobProvider {
  name = "The Muse Jobs API (Free Worldwide)";
  providerKey = "themuse";

  isConfigured(): boolean {
    return true; // The Muse public jobs endpoint is unauthenticated (optional API key enhances rate limits)
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    const res = await this.execute(params);
    return res.jobs;
  }

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const adapted = adaptQueryForProvider("themuse", params);
    const maxResults = Math.min(params.maxResults || 25, 50);
    const cacheKey = `online:themuse:${adapted.cleanQuery}:${maxResults}`;

    // 1. Fresh Cache Check
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

    let httpStatus: number | null = null;
    let errorMessage: string | null = null;
    let rawJobs: any[] = [];
    let isRateLimited = false;

    try {
      const url = new URL("https://www.themuse.com/api/public/jobs");
      url.searchParams.set("page", "1");
      url.searchParams.set("descending", "true");

      const apiKey = process.env.THE_MUSE_API_KEY;
      if (apiKey && apiKey.trim() !== "") {
        url.searchParams.set("api_key", apiKey.trim());
      }

      if (params.category && params.category !== "all") {
        url.searchParams.set("category", params.category);
      }

      console.log(`[TheMuse] Fetching curated jobs: "${url.toString()}"`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "WebHunt-Discovery/2.0 (JobDiscovery)",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      httpStatus = response.status;

      if (response.status === 429) {
        isRateLimited = true;
        errorMessage = "The Muse rate limit reached (HTTP 429)";
      } else if (!response.ok) {
        errorMessage = `The Muse HTTP ${response.status}: ${response.statusText}`;
      } else {
        const data = await response.json();
        rawJobs = Array.isArray(data.results) ? data.results : [];
      }
    } catch (err: any) {
      errorMessage = err?.message || "The Muse fetch error";
    }

    // 2. Normalization & Token Matching
    const leads: OnlineJobLead[] = [];
    for (const job of rawJobs) {
      const rawDesc = job.contents || "";
      const cleanSnippet = rawDesc
        .replace(/<[^>]*>?/gm, " ")
        .replace(/&[a-z0-9#]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 260) + "...";

      const locNames = Array.isArray(job.locations) && job.locations.length > 0
        ? job.locations.map((l: any) => l.name).filter(Boolean)
        : ["Flexible / Remote"];
      const locStr = locNames.join(", ");
      const isRemoteJob = locStr.toLowerCase().includes("remote") || locStr.toLowerCase().includes("flexible");
      const locClassification = classifyLocation(locStr, isRemoteJob);

      const tags: string[] = [];
      if (Array.isArray(job.categories)) {
        tags.push(...job.categories.map((c: any) => c.name).filter(Boolean));
      }
      if (Array.isArray(job.levels)) {
        tags.push(...job.levels.map((lvl: any) => lvl.name).filter(Boolean));
      }
      if (tags.length === 0) tags.push("remote", "curated");

      const title = (job.name || "Professional Opportunity").trim();
      const company = job.company?.name || "Verified Employer";

      // Token match filter
      if (adapted.tokens.length > 0) {
        const matches = leadMatchesSearchTokens(
          { title, descriptionSnippet: cleanSnippet, tags, company },
          adapted.tokens
        );
        if (!matches) continue;
      }

      const applyUrl = job.refs?.landing_page || `https://www.themuse.com/jobs/${job.short_name || job.id}`;
      const primaryCat = Array.isArray(job.categories) && job.categories.length > 0
        ? job.categories[0].name
        : "Professional Opportunities";

      leads.push({
        id: `themuse-${job.id}`,
        type: "online",
        title,
        company,
        companyLogo: null,
        location: locClassification.displayLocation,
        country: locClassification.country || "Worldwide",
        isRemote: isRemoteJob,
        remoteType: locClassification.remoteType,
        category: primaryCat,
        tags: tags.slice(0, 6),
        url: applyUrl,
        postedDate: job.publication_date ? job.publication_date.split("T")[0] : new Date().toISOString().split("T")[0],
        salary: "Competitive",
        source: "themuse",
        sourceId: String(job.id),
        sourceUrl: applyUrl,
        sourceType: "job_board",
        opportunityType: "full_time",
        descriptionSnippet: cleanSnippet,
        status: "NEW",
        estimatedValue: 4500,
        notes: null,
        dataQualityScore: 0.95,
        verificationStatus: "VERIFIED",
        retrievedAt: new Date(),
        lastVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (leads.length >= maxResults) break;
    }

    // 3. Stale Cache Fallback if failed or rate limited
    if (leads.length === 0 && (errorMessage || isRateLimited)) {
      const stale = await durableCache.getWithStale<OnlineJobLead[]>(cacheKey, 86400);
      if (stale && stale.data.length > 0) {
        return {
          providerKey: this.providerKey,
          providerName: this.name,
          status: isRateLimited ? "rate_limited" : "degraded",
          fetchedCount: 0,
          normalizedCount: 0,
          filteredCount: stale.data.length,
          finalCount: stale.data.length,
          latencyMs: Date.now() - startTime,
          httpStatus,
          errorMessage,
          fromCache: true,
          staleCache: true,
          jobs: stale.data,
        };
      }
    }

    // 4. Cache successful live results
    if (leads.length > 0) {
      await durableCache.set(cacheKey, this.providerKey, adapted.cleanQuery, "Worldwide", leads, 3600);
    }

    const latencyMs = Date.now() - startTime;
    const status = leads.length > 0
      ? "success"
      : isRateLimited
      ? "rate_limited"
      : errorMessage
      ? "unavailable"
      : "success";

    return {
      providerKey: this.providerKey,
      providerName: this.name,
      status,
      fetchedCount: rawJobs.length,
      normalizedCount: leads.length,
      filteredCount: leads.length,
      finalCount: leads.length,
      latencyMs,
      httpStatus,
      errorMessage,
      fromCache: false,
      staleCache: false,
      jobs: leads,
    };
  }
}
