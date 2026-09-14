package com.webhunt.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.webhunt.app.data.model.CountryOption
import com.webhunt.app.data.model.IndustryCategory
import com.webhunt.app.data.model.IndustryDefinition
import com.webhunt.app.data.model.OnlineJobLead
import com.webhunt.app.data.model.PhysicalLead
import com.webhunt.app.data.model.SearchRequest
import com.webhunt.app.data.repository.AuthRepository
import com.webhunt.app.data.repository.ParsedSearchResult
import com.webhunt.app.data.repository.PipelineRepository
import com.webhunt.app.data.repository.ProfileRepository
import com.webhunt.app.data.repository.SearchRepository
import com.webhunt.app.data.repository.TaxonomyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val mode: String = "physical",
    val niche: String = "Plumbers & Plumbing Services",
    val selectedIndustryIds: List<String> = listOf("plumbing"),
    val country: String = "Kenya",
    val city: String = "",
    val onlineQuery: String = "React / Next.js Developer",
    val onlineIndustryIds: List<String> = listOf("react_nextjs"),
    val forceRefresh: Boolean = false,
    val isLoading: Boolean = false,
    val searchResult: ParsedSearchResult? = null,
    val errorMessage: String? = null,
    val authRequired: Boolean = false,
    val subscriptionRequired: Boolean = false,
    val minRating: Double = 0.0,
    val sortBy: String = "default" // "default", "rating", "name"
)

class HomeViewModel(
    private val searchRepo: SearchRepository,
    private val pipelineRepo: PipelineRepository,
    private val taxonomyRepo: TaxonomyRepository,
    private val authRepo: AuthRepository,
    private val profileRepo: ProfileRepository,
    private val historyManager: com.webhunt.app.data.storage.SearchHistoryManager? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    val categories: StateFlow<List<IndustryCategory>> = taxonomyRepo.categories
    val industries: StateFlow<List<IndustryDefinition>> = taxonomyRepo.industries
    val countries: StateFlow<List<CountryOption>> = taxonomyRepo.countries
    val savedLeadIds: StateFlow<Set<String>> = pipelineRepo.savedLeadIds
    val userProfile = profileRepo.profile

    init {
        viewModelScope.launch {
            taxonomyRepo.syncTaxonomy()
            profileRepo.fetchProfile()
            pipelineRepo.fetchPipeline()
        }
    }

    fun setMode(newMode: String) {
        _uiState.value = _uiState.value.copy(mode = newMode)
    }

    fun selectIndustry(ind: IndustryDefinition) {
        if (_uiState.value.mode == "physical") {
            _uiState.value = _uiState.value.copy(
                niche = ind.name,
                selectedIndustryIds = listOf(ind.id)
            )
        } else {
            _uiState.value = _uiState.value.copy(
                onlineQuery = ind.name,
                onlineIndustryIds = listOf(ind.id)
            )
        }
    }

    fun selectCountry(country: CountryOption) {
        _uiState.value = _uiState.value.copy(country = country.name)
    }

    fun setCity(city: String) {
        _uiState.value = _uiState.value.copy(city = city)
    }

    fun setForceRefresh(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(forceRefresh = enabled)
    }

    fun setMinRating(rating: Double) {
        _uiState.value = _uiState.value.copy(minRating = rating)
    }

    fun setSortBy(sort: String) {
        _uiState.value = _uiState.value.copy(sortBy = sort)
    }

    fun executeSearch() {
        val current = _uiState.value
        _uiState.value = current.copy(
            isLoading = true,
            errorMessage = null,
            authRequired = false,
            subscriptionRequired = false
        )

        val request = if (current.mode == "physical") {
            SearchRequest(
                mode = "physical",
                niche = current.niche,
                country = current.country,
                city = current.city.ifBlank { null },
                industryIds = current.selectedIndustryIds,
                forceRefresh = current.forceRefresh
            )
        } else {
            SearchRequest(
                mode = "online",
                query = current.onlineQuery,
                industryIds = current.onlineIndustryIds,
                forceRefresh = current.forceRefresh
            )
        }

        viewModelScope.launch {
            try {
                val result = searchRepo.executeSearch(request)
                result.onSuccess { data ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        searchResult = data
                    )
                    val queryText = if (current.mode == "physical") current.niche else current.onlineQuery
                    val locationText = if (current.mode == "physical") {
                        if (current.city.isNotBlank()) "${current.city}, ${current.country}" else current.country
                    } else "Remote / Global"
                    val yieldCount = if (data.mode == "physical") data.physicalLeads.size else data.onlineLeads.size

                    historyManager?.logSearch(
                        mode = current.mode,
                        query = queryText,
                        location = locationText,
                        provider = data.provider.ifBlank { if (current.mode == "physical") "osm" else "aggregator" },
                        totalFetched = yieldCount,
                        qualifiedCount = yieldCount
                    )
                }.onFailure { error ->
                    val msg = error.message ?: "Failed to execute lead scan"
                    val isAuth = msg.contains("Authentication required", ignoreCase = true)
                    val isSub = msg.contains("subscription", ignoreCase = true)

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = msg,
                        authRequired = isAuth,
                        subscriptionRequired = isSub
                    )
                }
            } catch (cancellation: kotlinx.coroutines.CancellationException) {
                throw cancellation
            } catch (t: Throwable) {
                android.util.Log.e("HomeViewModel", "Unexpected failure during lead radar scan", t)
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = t.message ?: "An unexpected error occurred during scan"
                )
            }
        }
    }

    fun runSearchFromHistory(item: com.webhunt.app.data.model.SearchHistoryItem) {
        if (item.mode == "physical") {
            val country = if (item.location.contains(",")) item.location.substringAfterLast(",").trim() else item.location
            val city = if (item.location.contains(",")) item.location.substringBeforeLast(",").trim() else ""
            _uiState.value = _uiState.value.copy(
                mode = "physical",
                niche = item.query,
                country = country.ifBlank { "Kenya" },
                city = city
            )
        } else {
            _uiState.value = _uiState.value.copy(
                mode = "online",
                onlineQuery = item.query
            )
        }
        executeSearch()
    }

    fun savePhysicalLead(lead: PhysicalLead) {
        viewModelScope.launch {
            pipelineRepo.saveLead(lead)
        }
    }

    fun saveOnlineJob(job: OnlineJobLead) {
        viewModelScope.launch {
            pipelineRepo.saveJobLead(job)
        }
    }

    fun bulkSaveAll() {
        val result = _uiState.value.searchResult ?: return
        viewModelScope.launch {
            if (result.mode == "physical") {
                pipelineRepo.bulkSavePhysical(result.physicalLeads)
            }
        }
    }
}
