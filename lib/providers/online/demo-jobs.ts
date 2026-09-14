import { IOnlineJobProvider, ProviderExecutionResult } from "./types";
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

  async execute(params: OnlineSearchParams): Promise<ProviderExecutionResult> {
    return {
      providerKey: this.providerKey,
      providerName: this.name,
      status: "disabled",
      fetchedCount: 0,
      normalizedCount: 0,
      filteredCount: 0,
      finalCount: 0,
      latencyMs: 0,
      errorMessage: "Demo provider is decommissioned in production",
      fromCache: false,
      staleCache: false,
      jobs: [],
    };
  }

  async fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]> {
    return [];
  }
}
