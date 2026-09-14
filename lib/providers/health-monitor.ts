import { ProviderExecutionResult } from "./online/types";

export type HealthStatus =
  | "ACTIVE"
  | "HEALTHY"
  | "DEGRADED"
  | "RATE_LIMITED"
  | "AUTH_REQUIRED"
  | "REQUIRES_CREDENTIALS"
  | "UNAVAILABLE"
  | "DOWN"
  | "SCHEMA_ERROR"
  | "DISABLED";

export interface ProviderHealthMetric {
  providerKey: string;
  name: string;
  type: "physical" | "online";
  status: HealthStatus;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  consecutiveFailures: number;
  averageLatencyMs: number;
  lastLatencyMs: number;
  lastSuccess?: string;
  lastFailure?: string;
  lastError?: string;
  totalResultsFound: number;
  lastHttpStatus?: number | null;
  retryAfterMs?: number | null;
}

class ProviderHealthMonitor {
  private metrics = new Map<string, ProviderHealthMetric>();

  registerProvider(providerKey: string, name: string, type: "physical" | "online", isConfigured = true) {
    if (!this.metrics.has(providerKey)) {
      this.metrics.set(providerKey, {
        providerKey,
        name,
        type,
        status: isConfigured ? "ACTIVE" : "AUTH_REQUIRED",
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        consecutiveFailures: 0,
        averageLatencyMs: 0,
        lastLatencyMs: 0,
        totalResultsFound: 0,
      });
    }
  }

  recordExecution(result: ProviderExecutionResult) {
    const metric = this.metrics.get(result.providerKey);
    if (!metric) return;

    metric.totalRequests++;
    metric.lastLatencyMs = Math.round(result.latencyMs);
    metric.lastHttpStatus = result.httpStatus;
    metric.retryAfterMs = result.retryAfterMs;

    if (result.status === "success") {
      metric.successfulRequests++;
      metric.consecutiveFailures = 0;
      metric.averageLatencyMs = Math.round(
        (metric.averageLatencyMs * (metric.successfulRequests - 1) + result.latencyMs) / metric.successfulRequests
      );
      metric.lastSuccess = new Date().toISOString();
      metric.totalResultsFound += result.finalCount;
      metric.status = "ACTIVE";
    } else if (result.status === "degraded") {
      metric.status = "DEGRADED";
      metric.totalResultsFound += result.finalCount;
    } else if (result.status === "rate_limited") {
      metric.failedRequests++;
      metric.consecutiveFailures++;
      metric.lastFailure = new Date().toISOString();
      metric.lastError = result.errorMessage || "Rate limited (HTTP 429)";
      metric.status = "RATE_LIMITED";
    } else if (result.status === "auth_required") {
      metric.status = "AUTH_REQUIRED";
      metric.lastError = result.errorMessage || "Authentication required / API key missing";
    } else if (result.status === "disabled") {
      metric.status = "DISABLED";
    } else {
      metric.failedRequests++;
      metric.consecutiveFailures++;
      metric.lastFailure = new Date().toISOString();
      metric.lastError = result.errorMessage || "Provider error";
      metric.status = result.status === "schema_error" ? "SCHEMA_ERROR" : "UNAVAILABLE";
    }
  }

  recordSuccess(providerKey: string, latencyMs: number, resultCount: number) {
    const metric = this.metrics.get(providerKey);
    if (!metric) return;

    metric.totalRequests++;
    metric.successfulRequests++;
    metric.consecutiveFailures = 0;
    metric.lastLatencyMs = Math.round(latencyMs);
    metric.averageLatencyMs = Math.round(
      (metric.averageLatencyMs * (metric.successfulRequests - 1) + latencyMs) / metric.successfulRequests
    );
    metric.lastSuccess = new Date().toISOString();
    metric.totalResultsFound += resultCount;
    metric.status = "ACTIVE";
  }

  recordFailure(providerKey: string, latencyMs: number, error: Error | string) {
    const metric = this.metrics.get(providerKey);
    if (!metric) return;

    metric.totalRequests++;
    metric.failedRequests++;
    metric.consecutiveFailures++;
    metric.lastLatencyMs = Math.round(latencyMs);
    metric.lastFailure = new Date().toISOString();
    metric.lastError = typeof error === "string" ? error : error.message;

    if (metric.consecutiveFailures >= 5) {
      metric.status = "UNAVAILABLE";
    } else if (metric.consecutiveFailures >= 2) {
      metric.status = "DEGRADED";
    }
  }

  getMetric(providerKey: string): ProviderHealthMetric | undefined {
    return this.metrics.get(providerKey);
  }

  getAllMetrics(): ProviderHealthMetric[] {
    return Array.from(this.metrics.values());
  }

  isProviderHealthy(providerKey: string): boolean {
    const m = this.metrics.get(providerKey);
    if (!m) return true;
    return m.status !== "UNAVAILABLE" && m.status !== "DOWN";
  }
}

export const healthMonitor = new ProviderHealthMonitor();
export default healthMonitor;
