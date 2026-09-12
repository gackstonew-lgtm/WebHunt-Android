import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";

export interface IOnlineJobProvider {
  name: string;
  providerKey: string;
  isConfigured(): boolean;
  fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]>;
}
