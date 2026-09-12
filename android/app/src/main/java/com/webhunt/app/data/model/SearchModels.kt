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
    val forceRefresh: Boolean = false
)

@Serializable
data class SearchResultData(
    val mode: String,
    val query: String,
    val location: String,
    val provider: String,
    val totalFetched: Int = 0,
    val qualifiedCount: Int = 0,
    val fromCache: Boolean = false,
    val sourcesQueried: List<String> = emptyList(),
    val failedSources: List<String> = emptyList(),
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
    val configured: Boolean,
    val isFree: Boolean
)

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
