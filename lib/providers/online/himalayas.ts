import { IOnlineJobProvider } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";

export class HimalayasJobProvider implements IOnlineJobProvider {
  name = "Himalayas Remote Jobs API (Free Worldwide)";
  providerKey = "himalayas";

  isConfigured(): boolean {
    return true; // Himalayas public JSON API is free
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    try {
      const query = (params.query || "").trim();
      const url = new URL("https://himalayas.app/jobs/api");
      url.searchParams.set("limit", String(Math.min(params.maxResults || 25, 40)));

      console.log(`[Himalayas] Querying remote jobs: "${query}"`);

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
        console.warn(`[Himalayas] HTTP ${response.status}: ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      const jobs = data.jobs || [];

      // Filter locally by keyword if provided
      const filtered = query
        ? jobs.filter((j: any) => {
            const q = query.toLowerCase();
            return (
              (j.title && j.title.toLowerCase().includes(q)) ||
              (j.companyName && j.companyName.toLowerCase().includes(q)) ||
              (Array.isArray(j.categories) && j.categories.some((c: string) => c.toLowerCase().includes(q))) ||
              (Array.isArray(j.skills) && j.skills.some((s: string) => s.toLowerCase().includes(q)))
            );
          })
        : jobs;

      return filtered.slice(0, params.maxResults || 25).map((job: any): OnlineJobLead => {
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

        const tags = Array.isArray(job.skills) && job.skills.length > 0
          ? job.skills.slice(0, 6)
          : Array.isArray(job.categories) ? job.categories.slice(0, 6) : ["remote", "tech"];

        const applyUrl = job.applicationLink || `https://himalayas.app/companies/${job.companySlug}/jobs/${job.slug}`;

        return {
          id: `himalayas-${job.id || job.slug}`,
          type: "online",
          title: job.title || "Remote Role",
          company: job.companyName || "Remote Company",
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
        };
      });
    } catch (error) {
      console.error("[Himalayas] Fetch jobs error:", error);
      return [];
    }
  }
}
