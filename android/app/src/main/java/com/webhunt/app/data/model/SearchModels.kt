package com.webhunt.app.data.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class SearchRequest(
    val mode: String, // "physical" or "online"
    val niche: String? = null,
    val country: String? = null,
    val city: String? = null,
    val radius: Int? = 25,
    val provider: String? = "all",
    val industryIds: List<String>? = null,
    val query: String? = null,
    val category: String? = null,
    val seniority: String? = null,
    val page: Int? = null,
    val forceRefresh: Boolean = false
)

@Serializable
data class ProviderHealth(
    val key: String = "",
    val name: String = "",
    val status: String = "HEALTHY", // "ACTIVE", "HEALTHY", "DEGRADED", "RATE_LIMITED", "AUTH_REQUIRED", "DOWN", "UNAVAILABLE"
    val configured: Boolean = true,
    val isFree: Boolean = true,
    val latencyMs: Long? = null,
    val message: String? = null
)

@Serializable
data class ProviderExecutionResult(
    val providerKey: String = "",
    val providerName: String = "",
    val status: String = "success", // success, degraded, rate_limited, auth_required, unavailable, schema_error, disabled
    val fetchedCount: Int = 0,
    val normalizedCount: Int = 0,
    val filteredCount: Int = 0,
    val finalCount: Int = 0,
    val latencyMs: Long = 0,
    val httpStatus: Int? = null,
    val errorCode: String? = null,
    val errorMessage: String? = null,
    val retryAfterMs: Long? = null,
    val fromCache: Boolean = false,
    val staleCache: Boolean = false
) {
    val isSuccess: Boolean
        get() = status.equals("success", ignoreCase = true)

    val isDegraded: Boolean
        get() = status.equals("degraded", ignoreCase = true)

    val isRateLimited: Boolean
        get() = status.equals("rate_limited", ignoreCase = true)

    val isAuthRequired: Boolean
        get() = status.equals("auth_required", ignoreCase = true)

    val isUnavailable: Boolean
        get() = status.equals("unavailable", ignoreCase = true) || status.equals("down", ignoreCase = true)
}

@Serializable
data class SearchDiagnostics(
    val totalProvidersQueried: Int = 0,
    val successfulProviders: Int = 0,
    val failedProviders: Int = 0,
    val sourcesQueried: List<String> = emptyList(),
    val sourcesFailed: List<String> = emptyList(),
    val sourcesSucceeded: List<String> = emptyList(),
    val executionTimeMs: Long? = null,
    val durationMs: Long? = null,
    val cached: Boolean = false,
    val totalRaw: Int = 0,
    val deduplicatedCount: Int = 0,
    val qualifiedCount: Int = 0,
    val providers: List<ProviderHealth> = emptyList(),
    val providerExecutions: List<ProviderExecutionResult> = emptyList()
) {
    val effectiveDurationMs: Long
        get() = executionTimeMs ?: durationMs ?: 0L
}

@Serializable
data class SearchResultData(
    val mode: String,
    val query: String,
    val location: String,
    val provider: String,
    val totalFetched: Int = 0,
    val qualifiedCount: Int = 0,
    val fromCache: Boolean = false,
    val staleCache: Boolean = false,
    val sourcesQueried: List<String> = emptyList(),
    val failedSources: List<String> = emptyList(),
    val diagnostics: SearchDiagnostics? = null,
    val leads: List<JsonElement> = emptyList()
)

@Serializable
data class SearchResponse(
    val success: Boolean,
    val data: SearchResultData? = null,
    val error: String? = null,
    val requireAuth: Boolean = false,
    val requireSubscription: Boolean = false
)

@Serializable
data class ProviderStatus(
    val key: String,
    val name: String,
    val configured: Boolean = true,
    val isFree: Boolean = true,
    val status: String? = null // "ACTIVE", "HEALTHY", "DEGRADED", "RATE_LIMITED", "AUTH_REQUIRED", "REQUIRES_CREDENTIALS", "UNAVAILABLE", "DOWN", "SCHEMA_ERROR", "DISABLED"
) {
    val isOperational: Boolean
        get() = when (status?.uppercase()?.trim()) {
            "UNAVAILABLE", "DOWN", "SCHEMA_ERROR", "DISABLED" -> false
            else -> configured
        }

    val isRateLimited: Boolean
        get() = status?.uppercase()?.trim() == "RATE_LIMITED"

    val isAuthRequired: Boolean
        get() = status?.uppercase()?.trim() in listOf("AUTH_REQUIRED", "REQUIRES_CREDENTIALS") || !configured
}

@Serializable
data class ProviderStatusesResponse(
    val success: Boolean = true,
    val physical: List<ProviderStatus> = emptyList(),
    val online: List<ProviderStatus> = emptyList(),
    val error: String? = null
)

@Serializable
data class SearchHistoryItem(
    val id: String,
    val mode: String, // "physical" or "online"
    val query: String,
    val location: String,
    val provider: String,
    val totalFetched: Int = 0,
    val qualifiedCount: Int = 0,
    val createdAt: String
)
