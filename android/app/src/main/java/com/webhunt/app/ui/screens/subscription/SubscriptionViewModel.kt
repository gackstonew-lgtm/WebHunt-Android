package com.webhunt.app.ui.screens.subscription

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.webhunt.app.data.model.PaymentPlan
import com.webhunt.app.data.model.SubscriptionStatusResult
import com.webhunt.app.data.repository.SubscriptionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SubscriptionUiState(
    val selectedPlanId: String = "annual",
    val currency: String = "USD", // "USD" or "KES"
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

class SubscriptionViewModel(
    private val subscriptionRepo: SubscriptionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SubscriptionUiState())
    val uiState: StateFlow<SubscriptionUiState> = _uiState.asStateFlow()

    val plans: StateFlow<List<PaymentPlan>> = subscriptionRepo.plans
    val subscriptionStatus: StateFlow<SubscriptionStatusResult> = subscriptionRepo.subscriptionStatus

    init {
        refresh()
    }

    fun refresh() {
        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
        viewModelScope.launch {
            val res = subscriptionRepo.fetchSubscription()
            res.onFailure {
                _uiState.value = _uiState.value.copy(errorMessage = it.message)
            }
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }

    fun selectPlan(planId: String) {
        _uiState.value = _uiState.value.copy(selectedPlanId = planId)
    }

    fun setCurrency(currency: String) {
        _uiState.value = _uiState.value.copy(currency = currency)
    }
}
