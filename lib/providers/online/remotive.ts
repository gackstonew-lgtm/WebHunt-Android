import { IOnlineJobProvider } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";
import { normalizeOnlineSearchQuery } from "@/lib/taxonomy/search-mapper";

export class RemotiveJobProvider implements IOnlineJobProvider {
  name = "Remotive Public API (Free Worldwide)";
  providerKey = "remotive";

  isConfigured(): boolean {
    return true; // Remotive public JSON endpoint is free and unauthenticated
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    try {
      const normalized = normalizeOnlineSearchQuery(params);
      const query = (normalized.jobTitles[0] || params.query || "").trim();
      const url = new URL("https://remotive.com/api/remote-jobs");
      
      if (query) {
        url.searchParams.set("search", query);
      }
      const cat = normalized.jobCategory || params.category;
      if (cat && cat !== "all") {
        url.searchParams.set("category", cat);
      }
      url.searchParams.set("limit", String(Math.min(params.maxResults || 25, 50)));

      console.log(`[Remotive] Fetching remote jobs with query: "${query}"`);

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
        console.warn(`[Remotive] HTTP ${response.status}: ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      const jobs = data.jobs || [];

      return jobs.map((job: any): OnlineJobLead => {
        const rawDesc = job.description || "";
        const cleanSnippet = rawDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";
        const locClassification = classifyLocation(job.candidate_required_location, true);

        return {
          id: `remotive-${job.id}`,
          type: "online",
          title: job.title || "Remote Specialist",
          company: job.company_name || "Remote Employer",
          companyLogo: job.company_logo || null,
          location: locClassification.displayLocation,
          country: locClassification.country || "Worldwide",
          isRemote: true,
          remoteType: locClassification.remoteType,
          category: job.category || "Software Development",
          tags: Array.isArray(job.tags) ? job.tags.slice(0, 6) : ["remote", "tech"],
          url: job.url,
          postedDate: job.publication_date ? job.publication_date.split("T")[0] : new Date().toISOString().split("T")[0],
          salary: job.salary || "Competitive",
          source: "remotive",
          sourceId: String(job.id),
          sourceUrl: job.url,
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
        };
      });
    } catch (error) {
      console.error("[Remotive] Fetch jobs failed:", error);
      return [];
    }
  }
}
