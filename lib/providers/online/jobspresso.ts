import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { adaptQueryForProvider, leadMatchesSearchTokens } from "@/lib/taxonomy/query-adapter";
import { durableCache } from "@/lib/cache/durable-cache";

export class JobspressoJobProvider implements IOnlineJobProvider {
  name = "Jobspresso Remote Jobs Feed";
  providerKey = "jobspresso";

  isConfigured(): boolean {
    return true; // Public syndicated feed
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    const res = await this.execute(params);
    return res.jobs;
  }

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const adapted = adaptQueryForProvider("jobspresso", params);
    const maxResults = Math.min(params.maxResults || 25, 50);
    const cacheKey = `online:jobspresso:${adapted.cleanQuery}:${maxResults}`;

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
    let items: OnlineJobLead[] = [];
    let rawItemsCount = 0;

    try {
      const feedUrl = "https://jobspresso.co/feed/";
      console.log(`[Jobspresso] Querying feed for "${adapted.cleanQuery}"`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch(feedUrl, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml, */*",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      httpStatus = response.status;

      if (!response.ok) {
        errorMessage = `Jobspresso HTTP error ${response.status}`;
      } else {
        const xmlText = await response.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match: RegExpExecArray | null;

        while ((match = itemRegex.exec(xmlText)) !== null) {
          rawItemsCount++;
          const itemBlock = match[1];

          const titleMatch = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i.exec(itemBlock) || /<title>([\s\S]*?)<\/title>/i.exec(itemBlock);
          const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemBlock);
          const descMatch = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i.exec(itemBlock) || /<description>([\s\S]*?)<\/description>/i.exec(itemBlock);
          const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemBlock);

          const fullTitle = titleMatch ? titleMatch[1].trim() : "Remote Role";
          const link = linkMatch ? linkMatch[1].trim() : "https://jobspresso.co";
          const rawDesc = descMatch ? descMatch[1] : "";
          const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

          let company = "Remote Employer";
          let jobTitle = fullTitle;
          if (fullTitle.includes("at ")) {
            const parts = fullTitle.split("at ");
            jobTitle = parts[0].trim();
            company = parts.slice(1).join("at ").trim();
          } else if (fullTitle.includes("–")) {
            const parts = fullTitle.split("–");
            jobTitle = parts[0].trim();
            company = parts.slice(1).join("–").trim();
          }

          const cleanSnippet = rawDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";

          // Token match filter
          if (adapted.tokens.length > 0) {
            const matches = leadMatchesSearchTokens(
              { title: jobTitle, descriptionSnippet: cleanSnippet, tags: ["remote", "jobspresso"], company },
              adapted.tokens
            );
            if (!matches) continue;
          }

          const locClassification = classifyLocation("Worldwide Remote", true);

          items.push({
            id: `jobspresso-${Buffer.from(link).toString("base64").slice(0, 16)}`,
            type: "online",
            title: jobTitle,
            company,
            companyLogo: null,
            location: "Worldwide Remote",
            country: "Worldwide",
            isRemote: true,
            remoteType: "worldwide",
            category: "Tech & Marketing",
            tags: ["remote", "jobspresso"],
            url: link,
            postedDate: pubDate,
            salary: "Competitive",
            source: "jobspresso",
            sourceId: link,
            sourceUrl: link,
            sourceType: "public_feed",
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
          });

          if (items.length >= maxResults) break;
        }
      }
    } catch (err: any) {
      errorMessage = err?.message || "Jobspresso feed error";
    }

    // Stale cache fallback
    if (items.length === 0 && errorMessage) {
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
          errorMessage: `Live feed failed (${errorMessage}), served bounded stale cache`,
          fromCache: true,
          staleCache: true,
          jobs: stale.data,
        };
      }
    }

    if (items.length > 0) {
      await durableCache.set(cacheKey, this.providerKey, adapted.cleanQuery, "Worldwide", items, 3600);
    }

    const latencyMs = Date.now() - startTime;
    return {
      providerKey: this.providerKey,
      providerName: this.name,
      status: items.length > 0 ? "success" : (errorMessage ? "unavailable" : "success"),
      fetchedCount: rawItemsCount,
      normalizedCount: items.length,
      filteredCount: items.length,
      finalCount: items.length,
      latencyMs,
      httpStatus,
      errorMessage,
      fromCache: false,
      staleCache: false,
      jobs: items,
    };
  }
}
