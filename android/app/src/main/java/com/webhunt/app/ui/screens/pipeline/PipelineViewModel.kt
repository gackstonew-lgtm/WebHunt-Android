package com.webhunt.app.ui.screens.pipeline

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.webhunt.app.data.model.OnlineJobLead
import com.webhunt.app.data.model.PhysicalLead
import com.webhunt.app.data.repository.PipelineRepository
import com.webhunt.app.data.repository.PipelineStats
import com.webhunt.app.data.repository.ProfileRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PipelineUiState(
    val pipelineMode: String = "sales", // "sales" or "jobs"
    val activeStageTab: String = "ALL",
    val isLoading: Boolean = false,
    val currencyMode: String = "USD",
    val errorMessage: String? = null
)

class PipelineViewModel(
    private val pipelineRepo: PipelineRepository,
    private val profileRepo: ProfileRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PipelineUiState())
    val uiState: StateFlow<PipelineUiState> = _uiState.asStateFlow()

    val physicalLeads: StateFlow<List<PhysicalLead>> = pipelineRepo.physicalLeads
    val onlineLeads: StateFlow<List<OnlineJobLead>> = pipelineRepo.onlineLeads
    val stats: StateFlow<PipelineStats> = pipelineRepo.stats
    val userProfile = profileRepo.profile

    init {
        refresh()
    }

    fun refresh() {
        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
        viewModelScope.launch {
            val res = pipelineRepo.fetchPipeline()
            res.onFailure {
                _uiState.value = _uiState.value.copy(errorMessage = it.message)
            }
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }

    fun setPipelineMode(mode: String) {
        _uiState.value = _uiState.value.copy(pipelineMode = mode, activeStageTab = "ALL")
    }

    fun setStageTab(tab: String) {
        _uiState.value = _uiState.value.copy(activeStageTab = tab)
    }

    fun setCurrencyMode(curr: String) {
        _uiState.value = _uiState.value.copy(currencyMode = curr)
    }

    fun updateLeadStatus(leadId: String, status: String) {
        viewModelScope.launch {
            pipelineRepo.updateStatus(leadId, status)
        }
    }

    fun updateLeadNotesAndValue(leadId: String, notes: String, value: Double, status: String) {
        viewModelScope.launch {
            pipelineRepo.updateStatus(leadId, status)
            pipelineRepo.updateNotesAndValue(leadId, notes, value)
        }
    }

    fun deleteLead(leadId: String) {
        viewModelScope.launch {
            pipelineRepo.deleteLead(leadId)
        }
    }
}
