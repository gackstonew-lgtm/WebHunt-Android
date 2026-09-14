import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { normalizeOnlineSearchQuery } from "@/lib/taxonomy/search-mapper";
import { adaptQueryForProvider } from "@/lib/taxonomy/query-adapter";
import { durableCache } from "@/lib/cache/durable-cache";

export class RemotiveJobProvider implements IOnlineJobProvider {
  name = "Remotive Public API (Free Worldwide)";
  providerKey = "remotive";

  isConfigured(): boolean {
    return true; // Remotive public JSON endpoint is free and unauthenticated
  }

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const adapted = adaptQueryForProvider(params);
    const normalized = normalizeOnlineSearchQuery(params);
    const query = (normalized.jobTitles[0] || adapted.cleanQuery || "").trim();
    const maxResults = params.maxResults || 25;
    const cacheKey = durableCache.generateKey(this.providerKey, { q: query, cat: params.category, loc: params.country });

    if (!params.forceRefresh) {
      const cached = await durableCache.get<OnlineJobLead[]>(cacheKey);
      if (cached) {
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

    try {
      const url = new URL("https://remotive.com/api/remote-jobs");
      if (query) {
        url.searchParams.set("search", query);
      }
      const cat = normalized.jobCategory || params.category;
      if (cat && cat !== "all") {
        url.searchParams.set("category", cat);
      }
      url.searchParams.set("limit", String(Math.min(maxResults, 50)));

      console.log(`[Remotive] Fetching remote jobs with query: "${query}"`);

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

      if (!response.ok) {
        console.warn(`[Remotive] HTTP ${response.status}: ${response.statusText}`);
        const stale = await durableCache.getWithStale<OnlineJobLead[]>(cacheKey, 86400);
        if (stale && stale.data.length > 0) {
          return {
            providerKey: this.providerKey,
            providerName: this.name,
            status: response.status === 429 ? "rate_limited" : "degraded",
            httpStatusCode: response.status,
            fetchedCount: 0,
            normalizedCount: 0,
            filteredCount: stale.data.length,
            finalCount: stale.data.length,
            latencyMs: Date.now() - startTime,
            errorMessage: `HTTP ${response.status} ${response.statusText}`,
            fromCache: true,
            staleCache: true,
            jobs: stale.data,
          };
        }
        return {
          providerKey: this.providerKey,
          providerName: this.name,
          status: response.status === 429 ? "rate_limited" : "unavailable",
          httpStatusCode: response.status,
          fetchedCount: 0,
          normalizedCount: 0,
          filteredCount: 0,
          finalCount: 0,
          latencyMs: Date.now() - startTime,
          errorMessage: `HTTP ${response.status} ${response.statusText}`,
          fromCache: false,
          staleCache: false,
          jobs: [],
        };
      }

      const data = await response.json();
      const jobs = data.jobs || [];

      const normalizedJobs: OnlineJobLead[] = jobs.map((job: any): OnlineJobLead => {
        const rawDesc = job.description || "";
        const cleanSnippet = rawDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";
        const locClassification = classifyLocation(job.candidate_required_location, true);
        const tags = Array.isArray(job.tags) ? job.tags.slice(0, 6) : ["remote", "tech"];

        return {
          id: `remotive-${job.id}`,
          type: "online",
          title: job.title || "Remote Specialist",
          company: job.company_name || "Remote Employer",
          companyLogo: job.company_logo || null,
          location: locClassification.displayLocation,
          country: locClassification.country || "Worldwide",
          isRemote: true,
          remoteType: locClassification.remoteType,
          category: job.category || "Software Development",
          tags,
          url: job.url,
          postedDate: job.publication_date ? job.publication_date.split("T")[0] : new Date().toISOString().split("T")[0],
          salary: job.salary || "Competitive",
          source: "remotive",
          sourceId: String(job.id),
          sourceUrl: job.url,
          sourceType: "job_board",
          opportunityType: (job.job_type === "contract" || tags.some((t: string) => t.toLowerCase().includes("contract"))) ? "contract" :
                           (job.job_type === "freelance" || tags.some((t: string) => t.toLowerCase().includes("freelance"))) ? "freelance" :
                           (job.job_type === "internship" || tags.some((t: string) => t.toLowerCase().includes("intern"))) ? "internship" : "full_time",
          descriptionSnippet: cleanSnippet,
          status: "NEW",
          estimatedValue: 3500,
          notes: null,
          dataQualityScore: 0.95,
          verificationStatus: "VERIFIED",
          retrievedAt: new Date(),
          lastVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      if (normalizedJobs.length > 0) {
        await durableCache.set(cacheKey, this.providerKey, query, "Worldwide", normalizedJobs, 3600);
      }

      const latencyMs = Date.now() - startTime;
      return {
        providerKey: this.providerKey,
        providerName: this.name,
        status: "success",
        httpStatusCode: 200,
        fetchedCount: jobs.length,
        normalizedCount: normalizedJobs.length,
        filteredCount: normalizedJobs.length,
        finalCount: normalizedJobs.length,
        latencyMs,
        fromCache: false,
        staleCache: false,
        jobs: normalizedJobs,
      };
    } catch (error: any) {
      console.error("[Remotive] Fetch jobs failed:", error);
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
          errorMessage: error?.message || "Remotive request failed, served stale cache",
          fromCache: true,
          staleCache: true,
          jobs: stale.data,
        };
      }
      return {
        providerKey: this.providerKey,
        providerName: this.name,
        status: "unavailable",
        fetchedCount: 0,
        normalizedCount: 0,
        filteredCount: 0,
        finalCount: 0,
        latencyMs: Date.now() - startTime,
        errorMessage: error?.message || "Remotive request failed",
        fromCache: false,
        staleCache: false,
        jobs: [],
      };
    }
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    const result = await this.execute(params);
    return result.jobs;
  }
}
