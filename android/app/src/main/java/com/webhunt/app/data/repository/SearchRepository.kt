package com.webhunt.app.data.repository

import android.util.Log
import com.webhunt.app.data.api.WebHuntApiService
import com.webhunt.app.data.model.JobProvenance
import com.webhunt.app.data.model.OnlineJobLead
import com.webhunt.app.data.model.PhysicalLead
import com.webhunt.app.data.model.ProviderStatusesResponse
import com.webhunt.app.data.model.SearchDiagnostics
import com.webhunt.app.data.model.SearchRequest
import com.webhunt.app.data.model.SearchResultData
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.util.concurrent.ConcurrentHashMap

data class ParsedSearchResult(
    val mode: String,
    val query: String,
    val location: String,
    val provider: String,
    val totalFetched: Int,
    val qualifiedCount: Int,
    val fromCache: Boolean,
    val staleCache: Boolean = false,
    val sourcesQueried: List<String>,
    val failedSources: List<String>,
    val diagnostics: SearchDiagnostics? = null,
    val physicalLeads: List<PhysicalLead> = emptyList(),
    val onlineLeads: List<OnlineJobLead> = emptyList()
)

private data class CachedSearchResult(
    val data: ParsedSearchResult,
    val timestamp: Long,
    val ttlMs: Long = 3600_000L // 1 hour TTL
) {
    val isExpired: Boolean
        get() = (System.currentTimeMillis() - timestamp) > ttlMs
}

class SearchRepository(private val api: WebHuntApiService) {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    private val cache = ConcurrentHashMap<String, CachedSearchResult>()

    private fun getCacheKey(request: SearchRequest): String {
        val q = (request.query ?: request.niche ?: "").trim().lowercase()
        val c = (request.country ?: "").trim().lowercase()
        val city = (request.city ?: "").trim().lowercase()
        val p = (request.provider ?: "all").trim().lowercase()
        return "${request.mode}:$q:$c:$city:$p"
    }

    suspend fun executeSearch(request: SearchRequest): Result<ParsedSearchResult> {
        val cacheKey = getCacheKey(request)

        // 1. Check in-memory fast cache if fresh scan is not explicitly requested
        if (!request.forceRefresh) {
            val cached = cache[cacheKey]
            if (cached != null && !cached.isExpired) {
                Log.d("WebHuntRadar", "[WebHunt Radar] Returning in-memory cached results for key: $cacheKey")
                return Result.success(cached.data.copy(fromCache = true, staleCache = false))
            }
        }

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
                            Log.w("SearchRepository", "Standard decode failed for physical lead: ${e.message}; attempting resilient fallback", e)
                            extractFallbackPhysicalLead(element)?.let { physicalList.add(it) }
                        }
                    }
                } else {
                    for (element in data.leads) {
                        try {
                            val job = json.decodeFromJsonElement<OnlineJobLead>(element)
                            onlineList.add(job)
                        } catch (e: Exception) {
                            Log.w("SearchRepository", "Standard decode failed for online job: ${e.message}; attempting resilient fallback", e)
                            extractFallbackOnlineJob(element)?.let { onlineList.add(it) }
                        }
                    }
                }

                // Sanitize IDs to guarantee uniqueness, non-empty, and non-undefined values across all items
                val sanitizedPhysicalList = mutableListOf<PhysicalLead>()
                val seenPhysIds = HashSet<String>()
                for ((idx, lead) in physicalList.withIndex()) {
                    var candidateId = lead.id.trim()
                    if (candidateId.isBlank() || candidateId.contains("undefined", ignoreCase = true)) {
                        val slug = lead.businessName.lowercase().replace(Regex("[^a-z0-9]"), "_").take(32)
                        candidateId = "${lead.sourceProvider}_${slug}_$idx"
                    }
                    var finalId = candidateId
                    var counter = 1
                    while (seenPhysIds.contains(finalId)) {
                        finalId = "${candidateId}_$counter"
                        counter++
                    }
                    seenPhysIds.add(finalId)
                    sanitizedPhysicalList.add(lead.copy(id = finalId))
                }

                val sanitizedOnlineList = mutableListOf<OnlineJobLead>()
                val seenOnlineIds = HashSet<String>()
                for ((idx, job) in onlineList.withIndex()) {
                    var candidateId = job.id.trim()
                    if (candidateId.isBlank() || candidateId.contains("undefined", ignoreCase = true)) {
                        val slug = (job.applicationUrl ?: job.url.ifBlank { "${job.company}_${job.title}" })
                            .lowercase()
                            .replace(Regex("[^a-z0-9]"), "_")
                            .take(32)
                        candidateId = "${job.source}_${slug}_$idx"
                    }
                    var finalId = candidateId
                    var counter = 1
                    while (seenOnlineIds.contains(finalId)) {
                        finalId = "${candidateId}_$counter"
                        counter++
                    }
                    seenOnlineIds.add(finalId)
                    sanitizedOnlineList.add(job.copy(id = finalId))
                }

                val parsed = ParsedSearchResult(
                    mode = data.mode,
                    query = data.query,
                    location = data.location,
                    provider = data.provider,
                    totalFetched = if (data.totalFetched > 0) data.totalFetched else if (data.mode == "physical") sanitizedPhysicalList.size else sanitizedOnlineList.size,
                    qualifiedCount = if (data.qualifiedCount > 0) data.qualifiedCount else if (data.mode == "physical") sanitizedPhysicalList.size else sanitizedOnlineList.size,
                    fromCache = data.fromCache,
                    staleCache = data.staleCache,
                    sourcesQueried = data.sourcesQueried,
                    failedSources = data.failedSources,
                    diagnostics = data.diagnostics,
                    physicalLeads = sanitizedPhysicalList,
                    onlineLeads = sanitizedOnlineList
                )

                // Cache the successful result
                cache[cacheKey] = CachedSearchResult(parsed, System.currentTimeMillis())

                // Structured Development Diagnostics
                logRadarDiagnostics(parsed)

                Result.success(parsed)
            } else {
                val errorMsg = com.webhunt.app.util.NetworkErrorHandler.getHttpErrorMessage(response, "Search radar failed")
                Log.w("SearchRepository", "[WebHunt Radar] HTTP Error encountered: $errorMsg")

                // Stale-cache fallback on rate limit (429) or server degradation
                val cached = cache[cacheKey]
                if (cached != null) {
                    Log.i("SearchRepository", "[WebHunt Radar] Provider degraded/rate-limited; activating stale-cache fallback")
                    Result.success(cached.data.copy(fromCache = true, staleCache = true))
                } else {
                    Result.failure(Exception(errorMsg))
                }
            }
        } catch (e: Exception) {
            val msg = com.webhunt.app.util.NetworkErrorHandler.getReadableErrorMessage(e, "Search radar failed")
            Log.w("SearchRepository", "[WebHunt Radar] Network exception encountered: $msg")

            // Stale-cache fallback on network failure / offline
            val cached = cache[cacheKey]
            if (cached != null) {
                Log.i("SearchRepository", "[WebHunt Radar] Offline or network error; returning stale cached results")
                Result.success(cached.data.copy(fromCache = true, staleCache = true))
            } else {
                Result.failure(Exception(msg, e))
            }
        }
    }

    private fun logRadarDiagnostics(parsed: ParsedSearchResult) {
        val execs = parsed.diagnostics?.providerExecutions ?: emptyList()
        val duration = parsed.diagnostics?.effectiveDurationMs ?: 0L
        Log.i("WebHuntRadar", "================== [WebHunt Radar Diagnostics] ==================")
        Log.i("WebHuntRadar", "Mode: ${parsed.mode.uppercase()} | Query: \"${parsed.query}\" | Duration: ${duration}ms | Cache: ${parsed.fromCache}")
        if (execs.isNotEmpty()) {
            for (exec in execs) {
                val cacheTag = if (exec.staleCache) "STALE" else if (exec.fromCache) "CACHE" else "LIVE"
                Log.i("WebHuntRadar", String.format(java.util.Locale.US, "%-14s %-13s %3d final (%s)", exec.providerKey, exec.status.uppercase(), exec.finalCount, cacheTag))
            }
        } else if (parsed.sourcesQueried.isNotEmpty()) {
            Log.i("WebHuntRadar", "Sources: ${parsed.sourcesQueried.joinToString(", ")}")
        }
        if (parsed.failedSources.isNotEmpty()) {
            Log.w("WebHuntRadar", "Degraded/Failed sources: ${parsed.failedSources.joinToString(", ")}")
        }
        Log.i("WebHuntRadar", "=================================================================")
    }

    private fun extractFallbackPhysicalLead(element: kotlinx.serialization.json.JsonElement): PhysicalLead? {
        return try {
            val obj = element.jsonObject
            val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: "lead_${System.currentTimeMillis()}"
            val name = obj["businessName"]?.jsonPrimitive?.contentOrNull
                ?: obj["name"]?.jsonPrimitive?.contentOrNull
                ?: "Local Business"
            val phone = obj["phone"]?.jsonPrimitive?.contentOrNull ?: ""
            val isPhoneUnavailable = phone.isBlank() || phone.startsWith("unlisted-")
            val phoneStatus = obj["phoneStatus"]?.jsonPrimitive?.contentOrNull ?: if (isPhoneUnavailable) "unavailable" else "source_listed"
            val phoneFormatted = if (isPhoneUnavailable) "Phone unavailable" else (obj["phoneFormatted"]?.jsonPrimitive?.contentOrNull ?: phone)
            val address = obj["address"]?.jsonPrimitive?.contentOrNull
            val city = obj["city"]?.jsonPrimitive?.contentOrNull
            val state = obj["state"]?.jsonPrimitive?.contentOrNull
            val country = obj["country"]?.jsonPrimitive?.contentOrNull ?: "Kenya"
            val postalCode = obj["postalCode"]?.jsonPrimitive?.contentOrNull
            val category = obj["category"]?.jsonPrimitive?.contentOrNull
            val provider = obj["sourceProvider"]?.jsonPrimitive?.contentOrNull ?: "osm"
            val sourceUrl = obj["sourceUrl"]?.jsonPrimitive?.contentOrNull
            val status = obj["status"]?.jsonPrimitive?.contentOrNull ?: "NEW"
            val websiteUrl = obj["websiteUrl"]?.jsonPrimitive?.contentOrNull
            val websiteStatus = obj["websiteStatus"]?.jsonPrimitive?.contentOrNull
            val hasWebsite = obj["hasWebsite"]?.jsonPrimitive?.booleanOrNull ?: (!websiteUrl.isNullOrBlank())
            val noWebsiteConf = obj["noWebsiteConfidence"]?.jsonPrimitive?.contentOrNull ?: "Verified"
            val relevanceScore = obj["relevanceScore"]?.jsonPrimitive?.contentOrNull?.toDoubleOrNull()
            val contactQualityScore = obj["contactQualityScore"]?.jsonPrimitive?.contentOrNull?.toDoubleOrNull()
            val sources = obj["sources"]?.let { srcEl ->
                try {
                    srcEl.jsonArray.mapNotNull { it.jsonPrimitive.contentOrNull }
                } catch (_: Exception) {
                    emptyList()
                }
            } ?: emptyList()

            PhysicalLead(
                id = id,
                type = "physical",
                businessName = name,
                phone = phone,
                phoneFormatted = phoneFormatted,
                phoneStatus = phoneStatus,
                address = address,
                city = city,
                state = state,
                country = country,
                postalCode = postalCode,
                category = category,
                hasWebsite = hasWebsite,
                websiteUrl = websiteUrl,
                websiteStatus = websiteStatus,
                noWebsiteConfidence = noWebsiteConf,
                sourceProvider = provider,
                sourceUrl = sourceUrl,
                status = status,
                relevanceScore = relevanceScore,
                contactQualityScore = contactQualityScore,
                sources = sources
            )
        } catch (err: Exception) {
            Log.e("SearchRepository", "Failed to construct fallback physical lead", err)
            null
        }
    }

    private fun extractFallbackOnlineJob(element: kotlinx.serialization.json.JsonElement): OnlineJobLead? {
        return try {
            val obj = element.jsonObject
            val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: "job_${System.currentTimeMillis()}"
            val title = obj["title"]?.jsonPrimitive?.contentOrNull ?: "Remote Specialist"
            val company = obj["company"]?.jsonPrimitive?.contentOrNull ?: "Remote Employer"
            val employer = obj["employer"]?.jsonPrimitive?.contentOrNull ?: company
            val location = obj["location"]?.jsonPrimitive?.contentOrNull ?: "Worldwide"
            val country = obj["country"]?.jsonPrimitive?.contentOrNull
            val url = obj["url"]?.jsonPrimitive?.contentOrNull ?: ""
            val applicationUrl = obj["applicationUrl"]?.jsonPrimitive?.contentOrNull ?: url
            val originalUrl = obj["originalUrl"]?.jsonPrimitive?.contentOrNull ?: url
            val postedDate = obj["postedDate"]?.jsonPrimitive?.contentOrNull ?: ""
            val publishedAt = obj["publishedAt"]?.jsonPrimitive?.contentOrNull ?: postedDate
            val source = obj["source"]?.jsonPrimitive?.contentOrNull ?: "online"
            val sourceId = obj["sourceId"]?.jsonPrimitive?.contentOrNull
            val sourceUrl = obj["sourceUrl"]?.jsonPrimitive?.contentOrNull
            val descriptionSnippet = obj["descriptionSnippet"]?.jsonPrimitive?.contentOrNull
            val status = obj["status"]?.jsonPrimitive?.contentOrNull ?: "NEW"
            val salary = obj["salary"]?.jsonPrimitive?.contentOrNull
            val eligibility = obj["eligibility"]?.jsonPrimitive?.contentOrNull
            val relevanceScore = obj["relevanceScore"]?.jsonPrimitive?.contentOrNull?.toDoubleOrNull()
            val contactQualityScore = obj["contactQualityScore"]?.jsonPrimitive?.contentOrNull?.toDoubleOrNull()
            val websiteStatus = obj["websiteStatus"]?.jsonPrimitive?.contentOrNull
            val opportunityType = obj["opportunityType"]?.jsonPrimitive?.contentOrNull
            val aiTaskType = obj["aiTaskType"]?.jsonPrimitive?.contentOrNull
            val aiTaskCategory = obj["aiTaskCategory"]?.jsonPrimitive?.contentOrNull
            val taskCompensationType = obj["taskCompensationType"]?.jsonPrimitive?.contentOrNull
            val taskCompensationAmount = obj["taskCompensationAmount"]?.jsonPrimitive?.contentOrNull
            val taskCompensationCurrency = obj["taskCompensationCurrency"]?.jsonPrimitive?.contentOrNull
            val countryEligibility = obj["countryEligibility"]?.jsonPrimitive?.contentOrNull

            val sources = obj["sources"]?.let { srcEl ->
                try {
                    srcEl.jsonArray.mapNotNull { it.jsonPrimitive.contentOrNull }
                } catch (_: Exception) {
                    emptyList()
                }
            } ?: emptyList()
            val skills = obj["skills"]?.let { skillEl ->
                try {
                    skillEl.jsonArray.mapNotNull { it.jsonPrimitive.contentOrNull }
                } catch (_: Exception) {
                    emptyList()
                }
            } ?: emptyList()

            OnlineJobLead(
                id = id,
                type = "online",
                title = title,
                company = company,
                employer = employer,
                location = location,
                country = country,
                url = url,
                applicationUrl = applicationUrl,
                originalUrl = originalUrl,
                postedDate = postedDate,
                publishedAt = publishedAt,
                salary = salary,
                source = source,
                sourceId = sourceId,
                sourceUrl = sourceUrl,
                sources = sources,
                skills = skills,
                eligibility = eligibility,
                descriptionSnippet = descriptionSnippet,
                status = status,
                relevanceScore = relevanceScore,
                contactQualityScore = contactQualityScore,
                websiteStatus = websiteStatus,
                opportunityType = opportunityType,
                aiTaskType = aiTaskType,
                aiTaskCategory = aiTaskCategory,
                taskCompensationType = taskCompensationType,
                taskCompensationAmount = taskCompensationAmount,
                taskCompensationCurrency = taskCompensationCurrency,
                countryEligibility = countryEligibility
            )
        } catch (err: Exception) {
            Log.e("SearchRepository", "Failed to construct fallback online job", err)
            null
        }
    }

    suspend fun getProviderStatuses(): Result<ProviderStatusesResponse> {
        return try {
            val response = api.getProviderStatuses()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = com.webhunt.app.util.NetworkErrorHandler.getHttpErrorMessage(response, "Failed to load provider statuses")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            val msg = com.webhunt.app.util.NetworkErrorHandler.getReadableErrorMessage(e, "Failed to load provider statuses")
            Result.failure(Exception(msg, e))
        }
    }
}
