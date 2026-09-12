import { IOnlineJobProvider } from "./types";
import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";

/**
 * DEPRECATED: Isolated offline test stub.
 * In production, WebHunt uses real data feeds (Remotive, Arbeitnow, Himalayas, WeWorkRemotely, Jobspresso, RemoteOK, Africa Remote).
 */
export class DemoOnlineJobProvider implements IOnlineJobProvider {
  name = "Demo Online Tech Gigs (Decommissioned)";
  providerKey = "demo";

  isConfigured(): boolean {
    return false; // Decommissioned in production
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    console.warn("[DemoOnlineJobProvider] Demo provider is decommissioned. Real data providers are active.");
    return [];
  }
}
