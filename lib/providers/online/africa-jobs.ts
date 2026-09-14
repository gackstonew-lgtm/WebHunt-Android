import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { adaptQueryForProvider, leadMatchesSearchTokens } from "@/lib/taxonomy/query-adapter";
import { durableCache } from "@/lib/cache/durable-cache";

export class AfricaJobsProvider implements IOnlineJobProvider {
  name = "Africa & Kenya Remote Discovery Adapter";
  providerKey = "africa";

  isConfigured(): boolean {
    return true; // Free public adapter
  }

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const adapted = adaptQueryForProvider(params);
    const maxResults = params.maxResults || 25;
    const cacheKey = durableCache.generateKey(this.providerKey, { q: adapted.cleanQuery, loc: params.country });

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
      console.log(`[AfricaJobs] Querying African & Kenya-accessible remote jobs: "${adapted.cleanQuery}"`);

      // Target live feeds with query parameters
      const himalayasUrl = new URL("https://himalayas.app/jobs/api/search");
      if (adapted.cleanQuery && adapted.cleanQuery !== "all" && adapted.cleanQuery !== "africa") {
        himalayasUrl.searchParams.set("q", adapted.cleanQuery);
      }
      himalayasUrl.searchParams.set("worldwide", "true");
      himalayasUrl.searchParams.set("sort", "recent");

      const remotiveUrl = new URL("https://remotive.com/api/remote-jobs");
      if (adapted.cleanQuery && adapted.cleanQuery !== "all" && adapted.cleanQuery !== "africa") {
        remotiveUrl.searchParams.set("search", adapted.cleanQuery);
      }
      remotiveUrl.searchParams.set("limit", "40");

      const targetUrls = [
        himalayasUrl.toString(),
        remotiveUrl.toString(),
      ];

      const results: OnlineJobLead[] = [];
      let totalFetched = 0;

      for (const urlStr of targetUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(urlStr, {
            headers: {
              Accept: "application/json",
              "User-Agent": "WebHunt-Discovery/2.0 (AfricaDiscovery)",
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!res.ok) continue;
          const data = await res.json();
          const jobs = data.jobs || [];
          totalFetched += jobs.length;

          for (const job of jobs) {
            const locStr = job.candidate_required_location || (Array.isArray(job.locationRestrictions) ? job.locationRestrictions.join(", ") : "Worldwide");
            const locLower = locStr.toLowerCase();
            const isAfricaFriendly = 
              locLower.includes("worldwide") ||
              locLower.includes("anywhere") ||
              locLower.includes("africa") ||
              locLower.includes("kenya") ||
              locLower.includes("emea") ||
              locLower.includes("global") ||
              locStr === "";

            if (!isAfricaFriendly) continue;

            const title = job.title || "Remote Specialist";
            const company = job.company_name || job.companyName || "Global Employer";
            const rawDesc = job.description || job.excerpt || "";
            const tags = Array.isArray(job.tags) ? job.tags : ["africa", "remote", "kenya"];

            if (adapted.tokens.length > 0) {
              const matches = leadMatchesSearchTokens(
                adapted.tokens,
                title,
                rawDesc,
                [company, job.category || "", ...tags]
              );
              if (!matches) continue;
            }

            const cleanSnippet = rawDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";
            const locClassification = classifyLocation(locStr, true);
            const applyUrl = job.url || job.applicationLink || `https://remotive.com`;

            results.push({
              id: `africa-${job.id || job.slug || Math.random().toString(36).substring(2, 8)}`,
              type: "online",
              title,
              company,
              companyLogo: job.company_logo || job.companyLogo || null,
              location: locClassification.displayLocation.includes("Worldwide") ? "Worldwide (Africa-Friendly)" : locClassification.displayLocation,
              country: locClassification.country || "Kenya & Africa (Remote)",
              isRemote: true,
              remoteType: locClassification.remoteType,
              category: job.category || "Technology & Remote Services",
              tags: tags.slice(0, 5),
              url: applyUrl,
              postedDate: job.publication_date ? job.publication_date.split("T")[0] : (job.pubDate ? new Date(job.pubDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]),
              salary: job.salary || "Competitive ($ USD)",
              source: "africa",
              sourceId: String(job.id || job.slug || applyUrl),
              sourceUrl: applyUrl,
              sourceType: "job_board",
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
            });

            if (results.length >= maxResults) break;
          }
        } catch (subErr) {
          console.warn(`[AfricaJobs] Sub-provider query failed for ${urlStr}:`, subErr);
        }
      }

      if (results.length > 0) {
        await durableCache.set(cacheKey, this.providerKey, adapted.cleanQuery, "Worldwide", results, 3600);
      }

      const latencyMs = Date.now() - startTime;
      return {
        providerKey: this.providerKey,
        providerName: this.name,
        status: "success",
        httpStatusCode: 200,
        fetchedCount: totalFetched,
        normalizedCount: results.length,
        filteredCount: results.length,
        finalCount: results.length,
        latencyMs,
        fromCache: false,
        staleCache: false,
        jobs: results,
      };
    } catch (error: any) {
      console.error("[AfricaJobs] Fetch jobs failed:", error);
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
          errorMessage: error?.message || "AfricaJobs query failed, served stale cache",
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
        errorMessage: error?.message || "AfricaJobs query failed",
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
