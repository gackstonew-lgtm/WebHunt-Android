import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { adaptQueryForProvider, leadMatchesSearchTokens } from "@/lib/taxonomy/query-adapter";
import { durableCache } from "@/lib/cache/durable-cache";

export class JobicyJobProvider implements IOnlineJobProvider {
  name = "Jobicy Remote Jobs API (Free Worldwide)";
  providerKey = "jobicy";

  isConfigured(): boolean {
    return true; // Jobicy public API v2 is free and unauthenticated
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    const result = await this.execute(params);
    return result.jobs;
  }

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const adapted = adaptQueryForProvider("jobicy", params);
    const maxResults = Math.min(params.maxResults || 25, 50);
    const cacheKey = `online:jobicy:${adapted.primaryTag}:${adapted.geo?.jobicyGeo || "all"}:${maxResults}`;

    // 1. Check fresh cache
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
    let usedRssFallback = false;

    // 2. Primary Attempt: Official Jobicy API v2
    try {
      const url = new URL("https://jobicy.com/api/v2/remote-jobs");
      url.searchParams.set("count", String(maxResults));
      if (adapted.primaryTag) {
        url.searchParams.set("tag", adapted.primaryTag);
      }
      if (adapted.geo?.jobicyGeo) {
        url.searchParams.set("geo", adapted.geo.jobicyGeo);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

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
        errorMessage = `API v2 returned HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (err: any) {
      errorMessage = err?.message || "Jobicy API v2 request failed";
    }

    // 3. Fallback Attempt: Syndicated RSS Feed
    if (rawJobs.length === 0) {
      try {
        const rssJobs = await this.fetchFromRss(adapted.cleanQuery, maxResults);
        if (rssJobs.length > 0) {
          rawJobs = rssJobs;
          usedRssFallback = true;
        }
      } catch (rssErr: any) {
        if (!errorMessage) errorMessage = rssErr?.message || "Jobicy RSS fallback failed";
      }
    }

    // 4. Normalization and Token-based filtering
    let normalizedLeads: OnlineJobLead[] = [];
    if (rawJobs.length > 0) {
      if (usedRssFallback) {
        normalizedLeads = rawJobs as OnlineJobLead[];
      } else {
        normalizedLeads = this.normalizeApiJobs(rawJobs, adapted.tokens, maxResults);
      }
    }

    const fetchedCount = rawJobs.length;
    const normalizedCount = normalizedLeads.length;

    // 5. Stale-Cache Fallback if live attempts produced 0 results due to network failure/error
    if (normalizedLeads.length === 0 && errorMessage) {
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
          errorMessage: `Live query failed (${errorMessage}), served bounded stale cache`,
          fromCache: true,
          staleCache: true,
          jobs: stale.data,
        };
      }
    }

    // 6. Cache successful live results
    if (normalizedLeads.length > 0) {
      await durableCache.set(cacheKey, this.providerKey, adapted.cleanQuery, adapted.geo?.countryName || "worldwide", normalizedLeads, 3600);
    }

    const latencyMs = Date.now() - startTime;
    const status = normalizedLeads.length > 0
      ? (usedRssFallback ? "degraded" : "success")
      : (errorMessage ? "unavailable" : "success");

    return {
      providerKey: this.providerKey,
      providerName: this.name,
      status,
      fetchedCount,
      normalizedCount,
      filteredCount: normalizedCount,
      finalCount: normalizedCount,
      latencyMs,
      httpStatus,
      errorMessage,
      fromCache: false,
      staleCache: false,
      jobs: normalizedLeads,
    };
  }

  private normalizeApiJobs(rawJobs: any[], tokens: string[], maxResults: number): OnlineJobLead[] {
    const leads: OnlineJobLead[] = [];

    for (const job of rawJobs) {
      const rawExcerpt = job.jobExcerpt || job.jobDescription || "";
      const cleanSnippet = rawExcerpt
        .replace(/<[^>]*>?/gm, " ")
        .replace(/&[a-z0-9#]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 260) + "...";

      const locClassification = classifyLocation(job.jobGeo || "Worldwide Remote", true);

      // Salary formatting
      let salaryStr = "Competitive";
      if (job.annualSalaryMin && job.annualSalaryMax) {
        const curr = job.salaryCurrency || "USD";
        salaryStr = `${curr} $${(job.annualSalaryMin / 1000).toFixed(0)}k - $${(job.annualSalaryMax / 1000).toFixed(0)}k/yr`;
      } else if (job.annualSalaryMin) {
        const curr = job.salaryCurrency || "USD";
        salaryStr = `${curr} From $${(job.annualSalaryMin / 1000).toFixed(0)}k/yr`;
      }

      // Opportunity type detection
      const jobTypes = Array.isArray(job.jobType) ? job.jobType.join(" ").toLowerCase() : (job.jobType || "").toLowerCase();
      let oppType: OnlineJobLead["opportunityType"] = "full_time";
      if (jobTypes.includes("freelance")) {
        oppType = "freelance";
      } else if (jobTypes.includes("contract")) {
        oppType = "contract";
      } else if (jobTypes.includes("part-time") || jobTypes.includes("part time")) {
        oppType = "part_time";
      } else if (jobTypes.includes("internship")) {
        oppType = "internship";
      }

      const tags: string[] = [];
      if (Array.isArray(job.jobIndustry)) tags.push(...job.jobIndustry);
      if (Array.isArray(job.jobType)) tags.push(...job.jobType);
      if (job.jobLevel) tags.push(job.jobLevel);
      if (job.jobGeo) tags.push(job.jobGeo);
      if (tags.length === 0) tags.push("remote", "tech");

      const applyUrl = job.url || `https://jobicy.com/jobs/${job.id}`;
      const title = job.jobTitle || "Remote Role";
      const company = job.companyName || "Remote Employer";

      // Token match filter
      if (tokens.length > 0) {
        const matches = leadMatchesSearchTokens({ title, descriptionSnippet: cleanSnippet, tags, company }, tokens);
        if (!matches) continue;
      }

      leads.push({
        id: `jobicy-${job.id || Math.random().toString(36).substring(2, 9)}`,
        type: "online",
        title,
        company,
        companyLogo: job.companyLogo || null,
        location: locClassification.displayLocation,
        country: locClassification.country || "Worldwide",
        isRemote: true,
        remoteType: locClassification.remoteType,
        category: Array.isArray(job.jobIndustry) && job.jobIndustry.length > 0 ? job.jobIndustry[0] : "Software & Technology",
        tags: tags.slice(0, 6),
        url: applyUrl,
        postedDate: job.pubDate ? job.pubDate.split("T")[0] : new Date().toISOString().split("T")[0],
        salary: salaryStr,
        source: "jobicy",
        sourceId: String(job.id || ""),
        sourceUrl: applyUrl,
        sourceType: "job_board",
        opportunityType: oppType,
        descriptionSnippet: cleanSnippet,
        status: "NEW",
        estimatedValue: 4200,
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

    return leads;
  }

  private async fetchFromRss(query: string, maxResults: number): Promise<OnlineJobLead[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://jobicy.com/jobs/feed", {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Jobicy RSS HTTP ${res.status}`);
    }

    const xml = await res.text();
    const items = this.parseRssItems(xml);

    return items.slice(0, maxResults).map((item, idx) => {
      const cleanSnippet = item.description
        .replace(/<[^>]*>?/gm, " ")
        .replace(/&[a-z0-9#]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 260) + "...";

      const locClassification = classifyLocation("Worldwide Remote", true);

      return {
        id: `jobicy-rss-${idx}-${Date.now()}`,
        type: "online",
        title: item.title,
        company: item.company || "Remote Company",
        companyLogo: null,
        location: locClassification.displayLocation,
        country: "Worldwide",
        isRemote: true,
        remoteType: "worldwide",
        category: "Software & Technology",
        tags: ["remote", "jobicy-feed"],
        url: item.link,
        postedDate: item.pubDate ? new Date(item.pubDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        salary: "Competitive",
        source: "jobicy",
        sourceId: item.link,
        sourceUrl: item.link,
        sourceType: "job_board",
        opportunityType: "full_time",
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
  }

  private parseRssItems(xml: string): Array<{ title: string; link: string; description: string; pubDate: string; company: string }> {
    const results: Array<{ title: string; link: string; description: string; pubDate: string; company: string }> = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1];
      const titleMatch = /<title>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/title>/i.exec(itemContent);
      const linkMatch = /<link>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/link>/i.exec(itemContent);
      const descMatch = /<description>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>/i.exec(itemContent);
      const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/i.exec(itemContent);

      const rawTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || "").trim() : "Remote Job";
      const link = linkMatch ? (linkMatch[1] || linkMatch[2] || "").trim() : "https://jobicy.com";
      const description = descMatch ? (descMatch[1] || descMatch[2] || "").trim() : "";
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";

      let title = rawTitle;
      let company = "Remote Employer";
      if (rawTitle.includes(" at ")) {
        const parts = rawTitle.split(" at ");
        title = parts[0].trim();
        company = parts.slice(1).join(" at ").trim();
      } else if (rawTitle.includes(": ")) {
        const parts = rawTitle.split(": ");
        company = parts[0].trim();
        title = parts.slice(1).join(": ").trim();
      }

      results.push({ title, link, description, pubDate, company });
    }

    return results;
  }
}
