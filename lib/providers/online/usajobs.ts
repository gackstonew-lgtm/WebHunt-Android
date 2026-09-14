import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { adaptQueryForProvider } from "@/lib/taxonomy/query-adapter";

export class UsaJobsProvider implements IOnlineJobProvider {
  name = "USAJobs Official Public API";
  providerKey = "usajobs";

  isConfigured(): boolean {
    return Boolean(
      process.env.USAJOBS_API_KEY &&
      process.env.USAJOBS_API_KEY.trim() !== "" &&
      process.env.USAJOBS_USER_AGENT &&
      process.env.USAJOBS_USER_AGENT.trim() !== ""
    );
  }

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const apiKey = process.env.USAJOBS_API_KEY;
    const userAgent = process.env.USAJOBS_USER_AGENT;

    if (!apiKey || !userAgent) {
      return {
        providerKey: this.providerKey,
        providerName: this.name,
        status: "auth_required",
        fetchedCount: 0,
        normalizedCount: 0,
        filteredCount: 0,
        finalCount: 0,
        latencyMs: Date.now() - startTime,
        errorMessage: "USAJOBS_API_KEY or USAJOBS_USER_AGENT not configured",
        fromCache: false,
        staleCache: false,
        jobs: [],
      };
    }

    try {
      const adapted = adaptQueryForProvider(params);
      const query = adapted.cleanQuery;
      const url = new URL("https://data.usajobs.gov/api/search");
      if (query) {
        url.searchParams.set("Keyword", query);
      }
      url.searchParams.set("ResultsPerPage", String(Math.min(params.maxResults || 20, 25)));

      console.log(`[USAJobs] Querying official API for Keyword="${query}"`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch(url.toString(), {
        headers: {
          Host: "data.usajobs.gov",
          "User-Agent": userAgent,
          "Authorization-Key": apiKey,
          Accept: "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[USAJobs] HTTP error ${response.status}: ${response.statusText}`);
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
      const items = data.SearchResult?.SearchResultItems || [];

      const jobs: OnlineJobLead[] = items.map((item: any): OnlineJobLead => {
        const desc = item.MatchedObjectDescriptor || {};
        const rawSnippet = desc.QualificationSummary || desc.UserArea?.Details?.MajorDuties?.[0] || "";
        const cleanSnippet = rawSnippet.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";
        
        const locString = desc.PositionLocationDisplay || "United States / Federal";
        const locClassification = classifyLocation(locString, false);

        let salaryStr = "Federal Scale";
        const remun = desc.PositionRemuneration?.[0];
        if (remun?.MinimumRange && remun?.MaximumRange) {
          salaryStr = `$${(parseFloat(remun.MinimumRange) / 1000).toFixed(0)}k - $${(parseFloat(remun.MaximumRange) / 1000).toFixed(0)}k/yr`;
        }

        const applyUrl = desc.ApplyURI?.[0] || desc.PositionURI || "https://www.usajobs.gov";

        return {
          id: `usajobs-${desc.PositionID || Math.random().toString(36).substring(2, 9)}`,
          type: "online",
          title: desc.PositionTitle || "Federal Position",
          company: desc.DepartmentName || desc.OrganizationName || "US Federal Agency",
          companyLogo: null,
          location: locClassification.displayLocation,
          country: "United States",
          isRemote: desc.TeleworkEligible || false,
          remoteType: desc.TeleworkEligible ? "regional" : "onsite",
          category: "Public Sector & Government",
          tags: ["federal", "government", "usajobs"],
          url: applyUrl,
          postedDate: desc.PublicationStartDate ? desc.PublicationStartDate.split("T")[0] : new Date().toISOString().split("T")[0],
          salary: salaryStr,
          source: "usajobs",
          sources: ["usajobs"],
          sourceId: String(desc.PositionID),
          sourceUrl: applyUrl,
          sourceType: "official_api",
          descriptionSnippet: cleanSnippet,
          status: "NEW",
          estimatedValue: 5000,
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
        fetchedCount: items.length,
        normalizedCount: jobs.length,
        filteredCount: jobs.length,
        finalCount: jobs.length,
        latencyMs: Date.now() - startTime,
        fromCache: false,
        staleCache: false,
        jobs,
      };
    } catch (err: any) {
      console.error("[USAJobs] Search error:", err);
      return {
        providerKey: this.providerKey,
        providerName: this.name,
        status: "unavailable",
        fetchedCount: 0,
        normalizedCount: 0,
        filteredCount: 0,
        finalCount: 0,
        latencyMs: Date.now() - startTime,
        errorMessage: err?.message || "USAJobs search failed",
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
