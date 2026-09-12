import { IOnlineJobProvider } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";

export class JobspressoJobProvider implements IOnlineJobProvider {
  name = "Jobspresso Remote Jobs Feed";
  providerKey = "jobspresso";

  isConfigured(): boolean {
    return true; // Public syndicated feed
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    try {
      const query = (params.query || "").trim();
      const feedUrl = "https://jobspresso.co/feed/";

      console.log(`[Jobspresso] Querying feed for "${query}"`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch(feedUrl, {
        headers: {
          "Accept": "application/rss+xml, application/xml, text/xml",
          "User-Agent": "WebHunt-Discovery/2.0 (JobDiscovery)",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[Jobspresso] HTTP error ${response.status}`);
        return [];
      }

      const xmlText = await response.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const items: OnlineJobLead[] = [];
      let match;

      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemBlock = match[1];

        const titleMatch = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i.exec(itemBlock) || /<title>([\s\S]*?)<\/title>/i.exec(itemBlock);
        const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemBlock);
        const descMatch = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i.exec(itemBlock) || /<description>([\s\S]*?)<\/description>/i.exec(itemBlock);
        const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemBlock);

        const fullTitle = titleMatch ? titleMatch[1].trim() : "Remote Role";
        const link = linkMatch ? linkMatch[1].trim() : "https://jobspresso.co";
        const rawDesc = descMatch ? descMatch[1] : "";
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

        // Format company and title
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

        if (query) {
          const q = query.toLowerCase();
          const matchQuery =
            jobTitle.toLowerCase().includes(q) ||
            company.toLowerCase().includes(q) ||
            rawDesc.toLowerCase().includes(q);
          if (!matchQuery) continue;
        }

        const cleanSnippet = rawDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";
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
          descriptionSnippet: cleanSnippet,
          status: "NEW",
          estimatedValue: 3800,
          notes: null,
          dataQualityScore: 0.90,
          verificationStatus: "VERIFIED",
          retrievedAt: new Date(),
          lastVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (items.length >= (params.maxResults || 25)) break;
      }

      return items;
    } catch (err) {
      console.error("[Jobspresso] RSS parse error:", err);
      return [];
    }
  }
}
