import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { adaptQueryForProvider } from "@/lib/taxonomy/query-adapter";

export class AdzunaJobProvider implements IOnlineJobProvider {
  name = "Adzuna Job Search API";
  providerKey = "adzuna";

  isConfigured(): boolean {
    return Boolean(
      process.env.ADZUNA_APP_ID &&
      process.env.ADZUNA_APP_ID.trim() !== "" &&
      process.env.ADZUNA_APP_KEY &&
      process.env.ADZUNA_APP_KEY.trim() !== ""
    );
  }

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !appKey) {
      return {
        providerKey: this.providerKey,
        providerName: this.name,
        status: "auth_required",
        fetchedCount: 0,
        normalizedCount: 0,
        filteredCount: 0,
        finalCount: 0,
        latencyMs: Date.now() - startTime,
        errorMessage: "ADZUNA_APP_ID or ADZUNA_APP_KEY not configured",
        fromCache: false,
        staleCache: false,
        jobs: [],
      };
    }

    try {
      const adapted = adaptQueryForProvider(params);
      const query = adapted.cleanQuery;
      const countryCode = (params.country || "gb").toLowerCase().slice(0, 2);
      const page = 1;
      
      const url = new URL(`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}`);
      url.searchParams.set("app_id", appId);
      url.searchParams.set("app_key", appKey);
      url.searchParams.set("results_per_page", String(Math.min(params.maxResults || 20, 25)));
      if (query) {
        url.searchParams.set("what", query);
      }
      url.searchParams.set("content-type", "application/json");

      console.log(`[Adzuna] Querying jobs for what="${query}" in country="${countryCode}"`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "WebHunt-Discovery/2.0",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[Adzuna] HTTP error ${response.status}: ${response.statusText}`);
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
      const results = data.results || [];

      const jobs: OnlineJobLead[] = results.map((item: any): OnlineJobLead => {
        const rawDesc = item.description || "";
        const cleanSnippet = rawDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";
        const locName = item.location?.display_name || "Remote / Hybrid";
        const locClassification = classifyLocation(locName, true);

        let salaryStr = "Competitive";
        if (item.salary_min && item.salary_max) {
          salaryStr = `$${(item.salary_min / 1000).toFixed(0)}k - $${(item.salary_max / 1000).toFixed(0)}k`;
        } else if (item.salary_min) {
          salaryStr = `From $${(item.salary_min / 1000).toFixed(0)}k`;
        }

        const applyUrl = item.redirect_url || `https://www.adzuna.com/jobs/details/${item.id}`;

        return {
          id: `adzuna-${item.id}`,
          type: "online",
          title: item.title || "Professional Role",
          company: item.company?.display_name || "Employer",
          companyLogo: null,
          location: locClassification.displayLocation,
          country: locClassification.country || "Worldwide",
          isRemote: true,
          remoteType: locClassification.remoteType,
          category: item.category?.label || "Employment & Tech",
          tags: ["adzuna", "verified-listing"],
          url: applyUrl,
          postedDate: item.created ? item.created.split("T")[0] : new Date().toISOString().split("T")[0],
          salary: salaryStr,
          source: "adzuna",
          sources: ["adzuna"],
          sourceId: String(item.id),
          sourceUrl: applyUrl,
          sourceType: "official_api",
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
        };
      });

      return {
        providerKey: this.providerKey,
        providerName: this.name,
        status: "success",
        httpStatusCode: 200,
        fetchedCount: results.length,
        normalizedCount: jobs.length,
        filteredCount: jobs.length,
        finalCount: jobs.length,
        latencyMs: Date.now() - startTime,
        fromCache: false,
        staleCache: false,
        jobs,
      };
    } catch (err: any) {
      console.error("[Adzuna] Search error:", err);
      return {
        providerKey: this.providerKey,
        providerName: this.name,
        status: "unavailable",
        fetchedCount: 0,
        normalizedCount: 0,
        filteredCount: 0,
        finalCount: 0,
        latencyMs: Date.now() - startTime,
        errorMessage: err?.message || "Adzuna request failed",
        fromCache: false,
        staleCache: false,
        jobs: [],
      };
    }
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    const res = await this.execute(params);
    return res.jobs;
  }
}
