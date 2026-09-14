package com.webhunt.app.data.repository

import com.webhunt.app.data.api.WebHuntApiService
import com.webhunt.app.data.model.OnlineJobLead
import com.webhunt.app.data.model.PhysicalLead
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.encodeToJsonElement
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

data class PipelineStats(
    val totalLeads: Int = 0,
    val totalEstimatedValue: Double = 0.0,
    val contactedCount: Int = 0,
    val closedCount: Int = 0,
    val physicalCount: Int = 0,
    val onlineCount: Int = 0
)

class PipelineRepository(private val api: WebHuntApiService) {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    private val _physicalLeads = MutableStateFlow<List<PhysicalLead>>(emptyList())
    val physicalLeads: StateFlow<List<PhysicalLead>> = _physicalLeads.asStateFlow()

    private val _onlineLeads = MutableStateFlow<List<OnlineJobLead>>(emptyList())
    val onlineLeads: StateFlow<List<OnlineJobLead>> = _onlineLeads.asStateFlow()

    private val _savedLeadIds = MutableStateFlow<Set<String>>(emptySet())
    val savedLeadIds: StateFlow<Set<String>> = _savedLeadIds.asStateFlow()

    private val _stats = MutableStateFlow(PipelineStats())
    val stats: StateFlow<PipelineStats> = _stats.asStateFlow()

    suspend fun fetchPipeline(): Result<Unit> {
        return try {
            val response = api.getPipelineLeads()
            if (response.isSuccessful && response.body() != null) {
                val root = response.body()!!
                val dataArray = root["data"]?.jsonArray ?: root["leads"]?.jsonArray

                val pList = mutableListOf<PhysicalLead>()
                val oList = mutableListOf<OnlineJobLead>()
                val ids = mutableSetOf<String>()

                if (dataArray != null) {
                    for (element in dataArray) {
                        val obj = element.jsonObject
                        val type = obj["type"]?.jsonPrimitive?.content ?: "physical"
                        val id = obj["id"]?.jsonPrimitive?.content ?: ""
                        if (id.isNotBlank()) ids.add(id)

                        if (type == "online") {
                            try {
                                val item = json.decodeFromJsonElement<OnlineJobLead>(element)
                                oList.add(item)
                            } catch (e: Exception) {
                                try {
                                    val idVal = obj["id"]?.jsonPrimitive?.content ?: ""
                                    val title = obj["title"]?.jsonPrimitive?.content ?: "Remote Opportunity"
                                    val comp = obj["company"]?.jsonPrimitive?.content ?: "Remote Employer"
                                    val loc = obj["location"]?.jsonPrimitive?.content ?: "Worldwide"
                                    val u = obj["url"]?.jsonPrimitive?.content ?: ""
                                    val st = obj["status"]?.jsonPrimitive?.content ?: "NEW"
                                    oList.add(OnlineJobLead(id = idVal, title = title, company = comp, location = loc, url = u, status = st))
                                } catch (_: Exception) {}
                            }
                        } else {
                            try {
                                val item = json.decodeFromJsonElement<PhysicalLead>(element)
                                val cleanItem = if (item.phone.startsWith("unlisted-") || item.phoneStatus == "unavailable") {
                                    item.copy(phoneFormatted = "Phone unavailable", phoneStatus = "unavailable")
                                } else item
                                pList.add(cleanItem)
                            } catch (e: Exception) {
                                try {
                                    val idVal = obj["id"]?.jsonPrimitive?.content ?: ""
                                    val name = obj["businessName"]?.jsonPrimitive?.content ?: "Local Business"
                                    val phone = obj["phone"]?.jsonPrimitive?.content ?: ""
                                    val isUnlisted = phone.isBlank() || phone.startsWith("unlisted-")
                                    val phoneFmt = if (isUnlisted) "Phone unavailable" else (obj["phoneFormatted"]?.jsonPrimitive?.content ?: phone)
                                    val phoneStatus = if (isUnlisted) "unavailable" else (obj["phoneStatus"]?.jsonPrimitive?.content ?: "source_listed")
                                    val city = obj["city"]?.jsonPrimitive?.content
                                    val country = obj["country"]?.jsonPrimitive?.content ?: "Kenya"
                                    val st = obj["status"]?.jsonPrimitive?.content ?: "NEW"
                                    pList.add(PhysicalLead(id = idVal, businessName = name, phone = phone, phoneFormatted = phoneFmt, phoneStatus = phoneStatus, city = city, country = country, status = st))
                                } catch (_: Exception) {}
                            }
                        }
                    }
                }

                _physicalLeads.value = pList
                _onlineLeads.value = oList
                _savedLeadIds.value = ids
                calculateStats(pList, oList)
                Result.success(Unit)
            } else {
                val errorMsg = com.webhunt.app.util.NetworkErrorHandler.getHttpErrorMessage(response, "Failed to fetch pipeline")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            val msg = com.webhunt.app.util.NetworkErrorHandler.getReadableErrorMessage(e, "Failed to fetch pipeline")
            Result.failure(Exception(msg, e))
        }
    }

    suspend fun saveLead(lead: PhysicalLead): Result<Unit> {
        return try {
            val safeLead = if (lead.phone.isBlank() || lead.phone.startsWith("unlisted-")) {
                lead.copy(
                    phone = if (lead.phone.startsWith("unlisted-")) lead.phone else "unlisted-${lead.id}",
                    phoneFormatted = "Phone unavailable",
                    phoneStatus = "unavailable"
                )
            } else lead
            val element = json.encodeToJsonElement(safeLead)
            val payload = buildJsonObject {
                put("lead", element)
            }
            val response = api.savePipelineLead(payload)
            if (response.isSuccessful) {
                _physicalLeads.value = listOf(safeLead) + _physicalLeads.value.filter { it.id != safeLead.id }
                _savedLeadIds.value = _savedLeadIds.value + safeLead.id
                calculateStats(_physicalLeads.value, _onlineLeads.value)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to save lead"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun saveJobLead(lead: OnlineJobLead): Result<Unit> {
        return try {
            val element = json.encodeToJsonElement(lead)
            val payload = buildJsonObject {
                put("lead", element)
            }
            val response = api.savePipelineLead(payload)
            if (response.isSuccessful) {
                _onlineLeads.value = listOf(lead) + _onlineLeads.value.filter { it.id != lead.id }
                _savedLeadIds.value = _savedLeadIds.value + lead.id
                calculateStats(_physicalLeads.value, _onlineLeads.value)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to save job"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun bulkSavePhysical(leads: List<PhysicalLead>): Result<Unit> {
        return try {
            val safeLeads = leads.map { lead ->
                if (lead.phone.isBlank() || lead.phone.startsWith("unlisted-")) {
                    lead.copy(
                        phone = if (lead.phone.startsWith("unlisted-")) lead.phone else "unlisted-${lead.id}",
                        phoneFormatted = "Phone unavailable",
                        phoneStatus = "unavailable"
                    )
                } else lead
            }
            val element = json.encodeToJsonElement(safeLeads)
            val payload = buildJsonObject {
                put("leads", element)
            }
            val response = api.savePipelineLead(payload)
            if (response.isSuccessful) {
                val newIds = safeLeads.map { it.id }.toSet()
                _physicalLeads.value = safeLeads + _physicalLeads.value.filter { it.id !in newIds }
                _savedLeadIds.value = _savedLeadIds.value + newIds
                calculateStats(_physicalLeads.value, _onlineLeads.value)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to bulk save"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateStatus(leadId: String, newStatus: String): Result<Unit> {
        return try {
            val payload = buildJsonObject {
                put("status", newStatus)
            }
            val response = api.updatePipelineLead(leadId, payload)
            if (response.isSuccessful) {
                _physicalLeads.value = _physicalLeads.value.map {
                    if (it.id == leadId) it.copy(status = newStatus) else it
                }
                _onlineLeads.value = _onlineLeads.value.map {
                    if (it.id == leadId) it.copy(status = newStatus) else it
                }
                calculateStats(_physicalLeads.value, _onlineLeads.value)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to update status"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateNotesAndValue(leadId: String, notes: String, estimatedValue: Double): Result<Unit> {
        return try {
            val payload = buildJsonObject {
                put("notes", notes)
                put("estimatedValue", estimatedValue)
            }
            val response = api.updatePipelineLead(leadId, payload)
            if (response.isSuccessful) {
                _physicalLeads.value = _physicalLeads.value.map {
                    if (it.id == leadId) it.copy(notes = notes, estimatedValue = estimatedValue) else it
                }
                _onlineLeads.value = _onlineLeads.value.map {
                    if (it.id == leadId) it.copy(notes = notes, estimatedValue = estimatedValue) else it
                }
                calculateStats(_physicalLeads.value, _onlineLeads.value)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to update notes"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteLead(leadId: String): Result<Unit> {
        return try {
            val response = api.deletePipelineLead(leadId)
            if (response.isSuccessful) {
                _physicalLeads.value = _physicalLeads.value.filter { it.id != leadId }
                _onlineLeads.value = _onlineLeads.value.filter { it.id != leadId }
                _savedLeadIds.value = _savedLeadIds.value - leadId
                calculateStats(_physicalLeads.value, _onlineLeads.value)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete lead"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun calculateStats(phys: List<PhysicalLead>, onl: List<OnlineJobLead>) {
        val totalCount = phys.size + onl.size
        val totalVal = phys.sumOf { it.estimatedValue } + onl.sumOf { it.estimatedValue }
        val contacted = phys.count { it.status == "CONTACTED" || it.status == "INTERESTED" } +
                onl.count { it.status == "APPLIED" || it.status == "INTERVIEW" }
        val closed = phys.count { it.status == "CLOSED" } + onl.count { it.status == "OFFER" }

        _stats.value = PipelineStats(
            totalLeads = totalCount,
            totalEstimatedValue = totalVal,
            contactedCount = contacted,
            closedCount = closed,
            physicalCount = phys.size,
            onlineCount = onl.size
        )
    }

    fun clear() {
        _physicalLeads.value = emptyList()
        _onlineLeads.value = emptyList()
        _savedLeadIds.value = emptySet()
        _stats.value = PipelineStats()
    }
}
