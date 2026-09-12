import { IOnlineJobProvider } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";

export class RemoteOkJobProvider implements IOnlineJobProvider {
  name = "Remote OK Public API (Free Worldwide)";
  providerKey = "remoteok";

  isConfigured(): boolean {
    return true; // RemoteOK public JSON API is unauthenticated
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    try {
      const query = (params.query || "").trim();
      const url = new URL("https://remoteok.com/api");
      if (query) {
        url.searchParams.set("tag", query.toLowerCase());
      }

      console.log(`[RemoteOK] Querying public API: "${query}"`);

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
        console.warn(`[RemoteOK] HTTP ${response.status}: ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      // RemoteOK returns an array where first item is legal info
      const rawJobs = Array.isArray(data) ? data.slice(1) : [];

      const filtered = query
        ? rawJobs.filter((j: any) => {
            const q = query.toLowerCase();
            return (
              (j.position && j.position.toLowerCase().includes(q)) ||
              (j.company && j.company.toLowerCase().includes(q)) ||
              (Array.isArray(j.tags) && j.tags.some((t: string) => t.toLowerCase().includes(q))) ||
              (j.description && j.description.toLowerCase().includes(q))
            );
          })
        : rawJobs;

      return filtered.slice(0, params.maxResults || 25).map((job: any): OnlineJobLead => {
        const rawDesc = job.description || "";
        const cleanSnippet = rawDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";
        const locClassification = classifyLocation(job.location, true);

        const tags = Array.isArray(job.tags) ? job.tags.slice(0, 6) : ["remote"];
        const applyUrl = job.url || (job.apply_url ? job.apply_url : `https://remoteok.com/remote-jobs/${job.id}`);

        return {
          id: `remoteok-${job.id}`,
          type: "online",
          title: job.position || "Remote Developer",
          company: job.company || "Remote Company",
          companyLogo: job.company_logo || null,
          location: locClassification.displayLocation,
          country: locClassification.country || "Worldwide",
          isRemote: true,
          remoteType: locClassification.remoteType,
          category: "Software & Technology",
          tags,
          url: applyUrl,
          postedDate: job.date ? job.date.split("T")[0] : new Date().toISOString().split("T")[0],
          salary: (job.salary_min && job.salary_max) ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k` : "Competitive",
          source: "remoteok",
          sourceId: String(job.id),
          sourceUrl: applyUrl,
          sourceType: "job_board",
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
        };
      });
    } catch (error) {
      console.error("[RemoteOK] Fetch jobs failed:", error);
      return [];
    }
  }
}
