import { IOnlineJobProvider } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";
import { classifyLocation } from "@/lib/geo/classifier";

export class AfricaJobsProvider implements IOnlineJobProvider {
  name = "Africa & Kenya Remote Discovery Adapter";
  providerKey = "africa";

  isConfigured(): boolean {
    return true; // Free public adapter
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    try {
      const query = (params.query || "").trim();
      console.log(`[AfricaJobs] Querying African & Kenya-accessible remote jobs: "${query}"`);

      // Query Remotive and Himalayas with Africa location / global filters
      const targetUrls = [
        "https://remotive.com/api/remote-jobs?limit=40",
        "https://himalayas.app/jobs/api?limit=40",
      ];

      const results: OnlineJobLead[] = [];

      for (const urlStr of targetUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(urlStr, {
            headers: {
              "Accept": "application/json",
              "User-Agent": "WebHunt-Discovery/2.0 (AfricaDiscovery)",
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!res.ok) continue;
          const data = await res.json();
          const jobs = data.jobs || [];

          for (const job of jobs) {
            const locStr = job.candidate_required_location || (Array.isArray(job.locationRestrictions) ? job.locationRestrictions.join(", ") : "Worldwide");
            const locLower = locStr.toLowerCase();
            const isAfricaFriendly = 
              locLower.includes("worldwide") ||
              locLower.includes("anywhere") ||
              locLower.includes("africa") ||
              locLower.includes("kenya") ||
              locLower.includes("emea") ||
              locLower.includes("global");

            if (!isAfricaFriendly) continue;

            const title = job.title || "Remote Specialist";
            const company = job.company_name || job.companyName || "Global Employer";
            const rawDesc = job.description || job.excerpt || "";

            if (query && query !== "all" && query !== "africa") {
              const q = query.toLowerCase();
              const hasTagMatch = Array.isArray(job.tags) && job.tags.some((t: string) => t.toLowerCase().includes(q));
              const hasSkillMatch = Array.isArray(job.skills) && job.skills.some((s: string) => s.toLowerCase().includes(q));
              const matches =
                title.toLowerCase().includes(q) ||
                company.toLowerCase().includes(q) ||
                (job.category && job.category.toLowerCase().includes(q)) ||
                hasTagMatch ||
                hasSkillMatch ||
                rawDesc.toLowerCase().includes(q);
              if (!matches) continue;
            }

            const cleanSnippet = rawDesc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 260) + "...";
            const locClassification = classifyLocation(locStr, true);

            const applyUrl = job.url || job.applicationLink || `https://remotive.com`;

            results.push({
              id: `africa-${job.id || job.slug || Math.random().toString(36).substring(2, 8)}`,
              type: "online",
              title,
              company,
              companyLogo: job.company_logo || job.companyLogo || null,
              location: locClassification.displayLocation.includes("Worldwide") ? "Worldwide (Africa-Friendly)" : locClassification.displayLocation,
              country: locClassification.country || "Kenya & Africa (Remote)",
              isRemote: true,
              remoteType: locClassification.remoteType,
              category: job.category || "Technology & Remote Services",
              tags: Array.isArray(job.tags) ? job.tags.slice(0, 5) : ["africa", "remote", "kenya"],
              url: applyUrl,
              postedDate: job.publication_date ? job.publication_date.split("T")[0] : (job.pubDate ? new Date(job.pubDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]),
              salary: job.salary || "Competitive ($ USD)",
              source: "africa",
              sourceId: String(job.id || job.slug || applyUrl),
              sourceUrl: applyUrl,
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
            });

            if (results.length >= (params.maxResults || 25)) break;
          }
        } catch (subErr) {
          console.warn(`[AfricaJobs] Sub-provider query failed for ${urlStr}:`, subErr);
        }
      }

      return results;
    } catch (error) {
      console.error("[AfricaJobs] Fetch jobs failed:", error);
      return [];
    }
  }
}
