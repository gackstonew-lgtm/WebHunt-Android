import { IOnlineJobProvider } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";

export class ArbeitnowJobProvider implements IOnlineJobProvider {
  name = "Arbeitnow Public API (Free Worldwide)";
  providerKey = "arbeitnow";

  isConfigured(): boolean {
    return true; // Arbeitnow public JSON endpoint is free and unauthenticated
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    try {
      const query = (params.query || "").trim();
      const url = new URL("https://www.arbeitnow.com/api/job-board-api");
      if (query) {
        url.searchParams.set("search", query);
      }

      console.log(`[Arbeitnow] Querying job API: "${query}"`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch(url.toString(), {
        headers: {
          "Accept": "application/json",
          "User-Agent": "WebHunt-Discovery/2.0 (JobDiscovery)",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[Arbeitnow] HTTP ${response.status}: ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      const items = data.data || [];

      return items.slice(0, params.maxResults || 25).map((item: any): OnlineJobLead => {
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
    } catch (error) {
      console.error("[Arbeitnow] Fetch jobs error:", error);
      return [];
    }
  }
}
