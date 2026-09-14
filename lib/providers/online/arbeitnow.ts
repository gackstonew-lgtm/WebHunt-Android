import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { adaptQueryForProvider } from "@/lib/taxonomy/query-adapter";
import { durableCache } from "@/lib/cache/durable-cache";

export class ArbeitnowJobProvider implements IOnlineJobProvider {
  name = "Arbeitnow Public API (Free Worldwide)";
  providerKey = "arbeitnow";

  isConfigured(): boolean {
    return true; // Arbeitnow public JSON endpoint is free and unauthenticated
  }

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const adapted = adaptQueryForProvider(params);
    const query = (adapted.cleanQuery || params.query || "").trim();
    const maxResults = params.maxResults || 25;
    const cacheKey = durableCache.generateKey(this.providerKey, { q: query, loc: params.country });

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
      const url = new URL("https://www.arbeitnow.com/api/job-board-api");
      if (query) {
        url.searchParams.set("search", query);
      }

      console.log(`[Arbeitnow] Querying job API: "${query}"`);

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
        console.warn(`[Arbeitnow] HTTP ${response.status}: ${response.statusText}`);
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
      const items = data.data || [];

      const normalizedJobs: OnlineJobLead[] = items.slice(0, maxResults).map((item: any): OnlineJobLead => {
        const rawDesc = item.description || "";
        const cleanSnippet = rawDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";
        const locClassification = classifyLocation(item.location, Boolean(item.remote));

        return {
          id: `arbeitnow-${item.slug || Math.random().toString(36).substring(2, 9)}`,
          type: "online",
          title: item.title || "Software & Technology Role",
          company: item.company_name || "Technology Employer",
          companyLogo: null,
          location: locClassification.displayLocation,
          country: locClassification.country || (item.remote ? "Worldwide" : (item.location || "Worldwide")),
          isRemote: Boolean(item.remote),
          remoteType: locClassification.remoteType,
          category: "Technology & Engineering",
          tags: Array.isArray(item.tags) ? item.tags.slice(0, 6) : ["remote", "tech"],
          url: item.url,
          postedDate: item.created_at ? new Date(item.created_at * 1000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          salary: "Competitive",
          source: "arbeitnow",
          sourceId: item.slug || item.id,
          sourceUrl: item.url,
          sourceType: "job_board",
          opportunityType: Array.isArray(item.job_types) && item.job_types.includes("part_time") ? "part_time" :
                           (Array.isArray(item.tags) && item.tags.some((t: string) => t.toLowerCase().includes("contract"))) ? "contract" :
                           (Array.isArray(item.tags) && item.tags.some((t: string) => t.toLowerCase().includes("freelance"))) ? "freelance" :
                           (Array.isArray(item.tags) && item.tags.some((t: string) => t.toLowerCase().includes("intern"))) ? "internship" : "full_time",
          descriptionSnippet: cleanSnippet,
          status: "NEW",
          estimatedValue: 4000,
          notes: null,
          dataQualityScore: 0.90,
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
        fetchedCount: items.length,
        normalizedCount: normalizedJobs.length,
        filteredCount: normalizedJobs.length,
        finalCount: normalizedJobs.length,
        latencyMs,
        fromCache: false,
        staleCache: false,
        jobs: normalizedJobs,
      };
    } catch (error: any) {
      console.error("[Arbeitnow] Fetch jobs error:", error);
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
          errorMessage: error?.message || "Arbeitnow request failed, served stale cache",
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
        errorMessage: error?.message || "Arbeitnow request failed",
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
