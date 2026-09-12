package com.webhunt.app.data.repository

import com.webhunt.app.data.api.WebHuntApiService
import com.webhunt.app.data.model.OnlineJobLead
import com.webhunt.app.data.model.PhysicalLead
import com.webhunt.app.data.model.ProviderStatusesResponse
import com.webhunt.app.data.model.SearchRequest
import com.webhunt.app.data.model.SearchResultData
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeFromJsonElement

data class ParsedSearchResult(
    val mode: String,
    val query: String,
    val location: String,
    val provider: String,
    val totalFetched: Int,
    val qualifiedCount: Int,
    val fromCache: Boolean,
    val sourcesQueried: List<String>,
    val failedSources: List<String>,
    val physicalLeads: List<PhysicalLead> = emptyList(),
    val onlineLeads: List<OnlineJobLead> = emptyList()
)

class SearchRepository(private val api: WebHuntApiService) {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    suspend fun executeSearch(request: SearchRequest): Result<ParsedSearchResult> {
        return try {
            val response = api.executeSearch(request)
            if (response.isSuccessful && response.body()?.success == true) {
                val data: SearchResultData = response.body()!!.data!!

                val physicalList = mutableListOf<PhysicalLead>()
                val onlineList = mutableListOf<OnlineJobLead>()

                if (data.mode == "physical") {
                    for (element in data.leads) {
                        try {
                            val lead = json.decodeFromJsonElement<PhysicalLead>(element)
                            physicalList.add(lead)
                        } catch (e: Exception) {
                            // ignore unparseable item
                        }
                    }
                } else {
                    for (element in data.leads) {
                        try {
                            val job = json.decodeFromJsonElement<OnlineJobLead>(element)
                            onlineList.add(job)
                        } catch (e: Exception) {
                            // ignore unparseable item
                        }
                    }
                }

                val parsed = ParsedSearchResult(
                    mode = data.mode,
                    query = data.query,
                    location = data.location,
                    provider = data.provider,
                    totalFetched = data.totalFetched,
                    qualifiedCount = data.qualifiedCount,
                    fromCache = data.fromCache,
                    sourcesQueried = data.sourcesQueried,
                    failedSources = data.failedSources,
                    physicalLeads = physicalList,
                    onlineLeads = onlineList
                )
                Result.success(parsed)
            } else {
                val errorMsg = response.body()?.error ?: response.errorBody()?.string() ?: "Search radar failed"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProviderStatuses(): Result<ProviderStatusesResponse> {
        return try {
            val response = api.getProviderStatuses()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load provider statuses"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
