import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { adaptQueryForProvider, leadMatchesSearchTokens } from "@/lib/taxonomy/query-adapter";
import { durableCache } from "@/lib/cache/durable-cache";

export class WeWorkRemotelyJobProvider implements IOnlineJobProvider {
  name = "We Work Remotely Public RSS Feeds";
  providerKey = "weworkremotely";

  isConfigured(): boolean {
    return true; // Public syndicated RSS feeds
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    const res = await this.execute(params);
    return res.jobs;
  }

  private selectWwrFeeds(tokens: string[], category?: string): string[] {
    const tokensStr = tokens.join(" ").toLowerCase();
    const cat = (category || "").toLowerCase();
    const feeds: string[] = [];

    if (
      tokensStr.includes("front") ||
      tokensStr.includes("react") ||
      tokensStr.includes("vue") ||
      tokensStr.includes("angular") ||
      tokensStr.includes("next") ||
      tokensStr.includes("ui")
    ) {
      feeds.push("https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss");
      feeds.push("https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss");
    } else if (
      tokensStr.includes("back") ||
      tokensStr.includes("node") ||
      tokensStr.includes("python") ||
      tokensStr.includes("django") ||
      tokensStr.includes("golang") ||
      tokensStr.includes("java") ||
      tokensStr.includes("ruby")
    ) {
      feeds.push("https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss");
      feeds.push("https://weworkremotely.com/categories/remote-programming-jobs.rss");
    } else if (
      tokensStr.includes("devops") ||
      tokensStr.includes("cloud") ||
      tokensStr.includes("aws") ||
      tokensStr.includes("docker") ||
      tokensStr.includes("kubernetes")
    ) {
      feeds.push("https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss");
    } else if (tokensStr.includes("design") || tokensStr.includes("ux") || cat.includes("design")) {
      feeds.push("https://weworkremotely.com/categories/remote-design-jobs.rss");
    } else if (tokensStr.includes("sales") || tokensStr.includes("marketing") || cat.includes("marketing")) {
      feeds.push("https://weworkremotely.com/categories/remote-sales-and-marketing-jobs.rss");
    } else if (tokensStr.includes("support") || tokensStr.includes("customer") || cat.includes("support")) {
      feeds.push("https://weworkremotely.com/categories/remote-customer-support-jobs.rss");
    } else {
      feeds.push("https://weworkremotely.com/categories/remote-programming-jobs.rss");
      feeds.push("https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss");
    }

    return Array.from(new Set(feeds));
  }

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const adapted = adaptQueryForProvider("weworkremotely", params);
    const maxResults = Math.min(params.maxResults || 25, 50);
    const cacheKey = `online:weworkremotely:${adapted.cleanQuery}:${maxResults}`;

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

    let errorMessage: string | null = null;
    const targetFeeds = this.selectWwrFeeds(adapted.tokens, params.category);
    console.log(`[WeWorkRemotely] Querying ${targetFeeds.length} targeted RSS feeds for "${adapted.cleanQuery}"`);

    const feedPromises = targetFeeds.map(async (feedUrl) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6500);

        const response = await fetch(feedUrl, {
          headers: {
            Accept: "application/rss+xml, application/xml, text/xml",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) return "";
        return await response.text();
      } catch (err: any) {
        return "";
      }
    });

    const xmlTexts = await Promise.all(feedPromises);
    const items: OnlineJobLead[] = [];
    const seenLinks = new Set<string>();
    let totalXmlItemsParsed = 0;

    for (const xmlText of xmlTexts) {
      if (!xmlText) continue;
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match: RegExpExecArray | null;

      while ((match = itemRegex.exec(xmlText)) !== null) {
        totalXmlItemsParsed++;
        const itemBlock = match[1];

        const titleMatch = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i.exec(itemBlock) || /<title>([\s\S]*?)<\/title>/i.exec(itemBlock);
        const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemBlock);
        const descMatch = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i.exec(itemBlock) || /<description>([\s\S]*?)<\/description>/i.exec(itemBlock);
        const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemBlock);
        const regionMatch = /<region>([\s\S]*?)<\/region>/i.exec(itemBlock);

        const fullTitle = titleMatch ? titleMatch[1].trim() : "Remote Role";
        const link = linkMatch ? linkMatch[1].trim() : "https://weworkremotely.com";
        if (seenLinks.has(link)) continue;
        seenLinks.add(link);

        const rawDesc = descMatch ? descMatch[1] : "";
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        const regionText = regionMatch ? regionMatch[1].trim() : "Anywhere in the World";

        let company = "Remote Company";
        let jobTitle = fullTitle;
        if (fullTitle.includes(":")) {
          const parts = fullTitle.split(":");
          company = parts[0].trim();
          jobTitle = parts.slice(1).join(":").trim();
        }

        const cleanSnippet = rawDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";

        // Token match filter
        if (adapted.tokens.length > 0) {
          const matches = leadMatchesSearchTokens(
            { title: jobTitle, descriptionSnippet: cleanSnippet, tags: ["remote", "weworkremotely"], company },
            adapted.tokens
          );
          if (!matches) continue;
        }

        const locClassification = classifyLocation(regionText, true);

        items.push({
          id: `wwr-${Buffer.from(link).toString("base64").slice(0, 16)}`,
          type: "online",
          title: jobTitle,
          company,
          companyLogo: null,
          location: locClassification.displayLocation,
          country: locClassification.country || "Worldwide",
          isRemote: true,
          remoteType: locClassification.remoteType,
          category: "Software & Remote",
          tags: ["remote", "weworkremotely"],
          url: link,
          postedDate: pubDate,
          salary: "Competitive",
          source: "weworkremotely",
          sources: ["weworkremotely"],
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
      if (items.length >= maxResults) break;
    }

    // Stale cache fallback
    if (items.length === 0 && totalXmlItemsParsed === 0) {
      errorMessage = "We Work Remotely feeds unreachable";
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
          errorMessage,
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
      fetchedCount: totalXmlItemsParsed,
      normalizedCount: items.length,
      filteredCount: items.length,
      finalCount: items.length,
      latencyMs,
      errorMessage,
      fromCache: false,
      staleCache: false,
      jobs: items,
    };
  }
}
