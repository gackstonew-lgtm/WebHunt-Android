import { OnlineJobLead, OnlineSearchParams } from "@/lib/types";

export type ProviderExecutionStatus =
  | "success"
  | "degraded"
  | "rate_limited"
  | "auth_required"
  | "unavailable"
  | "schema_error"
  | "disabled";

export interface ProviderExecutionResult {
  providerKey: string;
  providerName: string;
  status: ProviderExecutionStatus;
  fetchedCount: number;
  normalizedCount: number;
  filteredCount: number;
  finalCount: number;
  latencyMs: number;
  httpStatus?: number | null;
  httpStatusCode?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  retryAfterMs?: number | null;
  fromCache: boolean;
  staleCache: boolean;
  jobs: OnlineJobLead[];
}

export interface IOnlineJobProvider {
  name: string;
  providerKey: string;
  isConfigured(): boolean;
  fetchJobs(params: OnlineSearchParams): Promise<OnlineJobLead[]>;
  execute(params: OnlineSearchParams): Promise<ProviderExecutionResult>;
}
