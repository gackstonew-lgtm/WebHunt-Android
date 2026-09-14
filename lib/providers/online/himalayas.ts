import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { adaptQueryForProvider, leadMatchesSearchTokens } from "@/lib/taxonomy/query-adapter";
import { durableCache } from "@/lib/cache/durable-cache";

export class HimalayasJobProvider implements IOnlineJobProvider {
  name = "Himalayas Remote Jobs API (Free Worldwide)";
  providerKey = "himalayas";

  isConfigured(): boolean {
    return true; // Himalayas public JSON API is free
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    const res = await this.execute(params);
    return res.jobs;
  }

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const adapted = adaptQueryForProvider("himalayas", params);
    const maxResults = Math.min(params.maxResults || 25, 50);
    const cacheKey = `online:himalayas:${adapted.cleanQuery}:${adapted.geo?.isoCode || "worldwide"}:${maxResults}`;

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
    let usedBrowseFallback = false;

    // 2. Primary Attempt: Search Endpoint
    try {
      const url = new URL("https://himalayas.app/jobs/api/search");
      if (adapted.cleanQuery) {
        url.searchParams.set("q", adapted.cleanQuery);
      }
      if (adapted.geo?.isoCode) {
        url.searchParams.set("country", adapted.geo.isoCode);
      } else {
        url.searchParams.set("worldwide", "true");
      }
      url.searchParams.set("sort", "recent");
      url.searchParams.set("page", "1");

      console.log(`[Himalayas] Querying remote jobs API: "${url.toString()}"`);

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

      if (response.ok) {
        const data = await response.json();
        rawJobs = Array.isArray(data.jobs) ? data.jobs : [];
      } else {
        errorMessage = `Himalayas search HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (err: any) {
      errorMessage = err?.message || "Himalayas search request failed";
    }

    // 3. Fallback Attempt: Browse Endpoint
    if (rawJobs.length === 0) {
      try {
        console.log("[Himalayas] Trying browse fallback endpoint...");
        const fallbackRes = await fetch("https://himalayas.app/jobs/api?limit=30", {
          headers: {
            Accept: "application/json",
            "User-Agent": "WebHunt-Discovery/2.0 (JobDiscovery)",
          },
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          rawJobs = Array.isArray(fallbackData.jobs) ? fallbackData.jobs : [];
          usedBrowseFallback = true;
        }
      } catch (fallbackErr: any) {
        if (!errorMessage) errorMessage = fallbackErr?.message || "Himalayas fallback failed";
      }
    }

    // 4. Normalization and Token Matching
    const leads: OnlineJobLead[] = [];
    for (const job of rawJobs) {
      const rawDesc = job.description || job.excerpt || "";
      const cleanSnippet = rawDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";
      
      const locString = Array.isArray(job.locationRestrictions) && job.locationRestrictions.length > 0
        ? job.locationRestrictions.join(", ")
        : "Worldwide Remote";
      const locClassification = classifyLocation(locString, true);

      // Salary formatting
      let salaryStr = "Competitive";
      if (job.minSalary && job.maxSalary) {
        salaryStr = `$${(job.minSalary / 1000).toFixed(0)}k - $${(job.maxSalary / 1000).toFixed(0)}k`;
      } else if (job.minSalary) {
        salaryStr = `From $${(job.minSalary / 1000).toFixed(0)}k`;
      }

      const tags: string[] = Array.isArray(job.skills) && job.skills.length > 0
        ? job.skills.slice(0, 6)
        : Array.isArray(job.categories) ? job.categories.slice(0, 6) : ["remote", "tech"];

      const applyUrl = job.applicationLink || `https://himalayas.app/companies/${job.companySlug}/jobs/${job.slug}`;
      const title = job.title || "Remote Role";
      const company = job.companyName || "Remote Company";

      // Token match filter
      if (adapted.tokens.length > 0) {
        const matches = leadMatchesSearchTokens(
          { title, descriptionSnippet: cleanSnippet, tags, company },
          adapted.tokens
        );
        if (!matches) continue;
      }

      const fallbackGuid = job.guid || job.applicationLink || `${company}-${title}`;
      const slugCandidate = job.slug || (typeof fallbackGuid === "string" ? fallbackGuid.split("/").filter(Boolean).pop() : null) || Math.random().toString(36).substring(2, 9);
      const cleanJobId = String(job.id || slugCandidate).replace(/[^a-zA-Z0-9_-]/g, "_");

      leads.push({
        id: `himalayas-${cleanJobId}`,
        type: "online",
        title,
        company,
        companyLogo: job.companyLogo || null,
        location: locClassification.displayLocation,
        country: locClassification.country || "Worldwide",
        isRemote: true,
        remoteType: locClassification.remoteType,
        category: Array.isArray(job.categories) && job.categories.length > 0 ? job.categories[0] : "Software & Remote",
        tags,
        url: applyUrl,
        postedDate: job.pubDate ? new Date(job.pubDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        salary: salaryStr,
        source: "himalayas",
        sourceId: String(job.id || job.slug),
        sourceUrl: applyUrl,
        sourceType: "job_board",
        opportunityType: tags.some((t: string) => t.toLowerCase().includes("contract")) ? "contract" :
                         tags.some((t: string) => t.toLowerCase().includes("freelance")) ? "freelance" :
                         tags.some((t: string) => t.toLowerCase().includes("intern")) ? "internship" : "full_time",
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

    // 5. Stale Cache Fallback if failed
    if (leads.length === 0 && errorMessage) {
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
          httpStatus,
          errorMessage: `Live search failed (${errorMessage}), served bounded stale cache`,
          fromCache: true,
          staleCache: true,
          jobs: stale.data,
        };
      }
    }

    // 6. Cache successful live results
    if (leads.length > 0) {
      await durableCache.set(cacheKey, this.providerKey, adapted.cleanQuery, adapted.geo?.countryName || "worldwide", leads, 3600);
    }

    const latencyMs = Date.now() - startTime;
    const status = leads.length > 0
      ? (usedBrowseFallback ? "degraded" : "success")
      : (errorMessage ? "unavailable" : "success");

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
