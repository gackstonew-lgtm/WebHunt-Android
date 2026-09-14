import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { adaptQueryForProvider, leadMatchesSearchTokens } from "@/lib/taxonomy/query-adapter";
import { durableCache } from "@/lib/cache/durable-cache";

function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "...");
}

export class RemoteOkJobProvider implements IOnlineJobProvider {
  name = "Remote OK Public API (Free Worldwide)";
  providerKey = "remoteok";

  isConfigured(): boolean {
    return true; // RemoteOK public JSON API is unauthenticated
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    const res = await this.execute(params);
    return res.jobs;
  }

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const adapted = adaptQueryForProvider("remoteok", params);
    const maxResults = Math.min(params.maxResults || 25, 50);
    const cacheKey = `online:remoteok:${adapted.primaryTag}:${maxResults}`;

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
    let retryAfterMs: number | null = null;
    let rawJobs: any[] = [];
    let isRateLimited = false;

    try {
      const url = new URL("https://remoteok.com/api");
      if (adapted.primaryTag && adapted.primaryTag !== "all") {
        url.searchParams.set("tag", adapted.primaryTag.toLowerCase());
      }

      console.log(`[RemoteOK] Querying public API: tag="${adapted.primaryTag}"`);

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
        const retryHeader = response.headers.get("retry-after");
        if (retryHeader) {
          const seconds = parseInt(retryHeader, 10);
          if (!isNaN(seconds)) retryAfterMs = seconds * 1000;
        }
        errorMessage = `Remote OK rate limited (HTTP 429)${retryAfterMs ? `, retry after ${retryAfterMs / 1000}s` : ""}`;
      } else if (!response.ok) {
        errorMessage = `Remote OK HTTP ${response.status}: ${response.statusText}`;
      } else {
        const data = await response.json();
        // First item in RemoteOK array is legal/metadata disclaimer
        rawJobs = Array.isArray(data) ? data.slice(1) : [];
      }
    } catch (err: any) {
      errorMessage = err?.message || "Remote OK fetch error";
    }

    // 2. Normalization & Token Matching
    const leads: OnlineJobLead[] = [];
    for (const job of rawJobs) {
      const rawDesc = job.description || "";
      const decodedDesc = decodeHtmlEntities(rawDesc);
      const cleanSnippet = decodedDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";
      const locClassification = classifyLocation(job.location, true);

      const tags: string[] = Array.isArray(job.tags) ? job.tags.slice(0, 6) : ["remote"];
      const title = decodeHtmlEntities(job.position || "Remote Developer");
      const company = decodeHtmlEntities(job.company || "Remote Company");

      // Token match filter
      if (adapted.tokens.length > 0) {
        const matches = leadMatchesSearchTokens(
          { title, descriptionSnippet: cleanSnippet, tags, company },
          adapted.tokens
        );
        if (!matches) continue;
      }

      const applyUrl = job.url || (job.apply_url ? job.apply_url : `https://remoteok.com/remote-jobs/${job.id}`);

      leads.push({
        id: `remoteok-${job.id}`,
        type: "online",
        title,
        company,
        companyLogo: job.company_logo || null,
        location: locClassification.displayLocation,
        country: locClassification.country || "Worldwide",
        isRemote: true,
        remoteType: locClassification.remoteType,
        category: "Software & Technology",
        tags,
        url: applyUrl,
        postedDate: job.date ? job.date.split("T")[0] : new Date().toISOString().split("T")[0],
        salary: (job.salary_min && job.salary_max)
          ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
          : "Competitive",
        source: "remoteok",
        sourceId: String(job.id),
        sourceUrl: applyUrl,
        sourceType: "job_board",
        opportunityType: tags.some((t: string) => t.toLowerCase().includes("contract"))
          ? "contract"
          : tags.some((t: string) => t.toLowerCase().includes("freelance"))
          ? "freelance"
          : tags.some((t: string) => t.toLowerCase().includes("intern"))
          ? "internship"
          : "full_time",
        descriptionSnippet: cleanSnippet,
        status: "NEW",
        estimatedValue: 4000,
        notes: null,
        dataQualityScore: 0.92,
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
          retryAfterMs,
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
      retryAfterMs,
      fromCache: false,
      staleCache: false,
      jobs: leads,
    };
  }
}
