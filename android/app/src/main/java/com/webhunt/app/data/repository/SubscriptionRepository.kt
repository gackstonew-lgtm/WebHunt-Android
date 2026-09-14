package com.webhunt.app.data.repository

import com.webhunt.app.data.api.WebHuntApiService
import com.webhunt.app.data.model.PaymentPlan
import com.webhunt.app.data.model.SubscriptionStatusResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class SubscriptionRepository(private val api: WebHuntApiService) {

    private val _plans = MutableStateFlow<List<PaymentPlan>>(DEFAULT_PLANS)
    val plans: StateFlow<List<PaymentPlan>> = _plans.asStateFlow()

    private val _subscriptionStatus = MutableStateFlow(SubscriptionStatusResult())
    val subscriptionStatus: StateFlow<SubscriptionStatusResult> = _subscriptionStatus.asStateFlow()

    suspend fun fetchSubscription(): Result<Unit> {
        return try {
            val response = api.getSubscription()
            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()!!
                if (body.plans.isNotEmpty()) _plans.value = body.plans
                if (body.subscription != null) _subscriptionStatus.value = body.subscription
                Result.success(Unit)
            } else {
                val errorMsg = com.webhunt.app.util.NetworkErrorHandler.getHttpErrorMessage(response, "Failed to fetch subscription")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            val msg = com.webhunt.app.util.NetworkErrorHandler.getReadableErrorMessage(e, "Failed to fetch subscription")
            Result.failure(Exception(msg, e))
        }
    }

    fun clear() {
        _subscriptionStatus.value = SubscriptionStatusResult()
    }

    companion object {
        val DEFAULT_PLANS = listOf(
            PaymentPlan(
                id = "monthly",
                name = "Monthly Access",
                tagline = "Unrestricted physical & remote lead radar scans with CRM pipeline access",
                priceUsd = 50.0,
                priceKes = 6500.0,
                amountUsd = 50.0,
                amountKes = 6500.0,
                durationDays = 30,
                interval = "monthly",
                isPopular = false,
                description = "Unrestricted physical & remote lead radar scans with CRM pipeline access",
                features = listOf(
                    "Unlimited Local Lead Radar Scans (No-Website Businesses)",
                    "Unlimited Remote Opportunity Scans (Tech, Writing, Design)",
                    "Instant WhatsApp, Phone & Direct Contact Enrichment",
                    "Full CRM Pipeline & Deal Tracking Workflow",
                    "AI Pitch Script & Proposal Draft Generators",
                    "Full CSV & Client Data Export",
                    "30-Day Unrestricted Access"
                )
            ),
            PaymentPlan(
                id = "annual",
                name = "Annual Pass",
                tagline = "Maximum value: 1 full year of uncapped radar discovery & CRM automation",
                priceUsd = 200.0,
                priceKes = 26000.0,
                amountUsd = 200.0,
                amountKes = 26000.0,
                durationDays = 365,
                interval = "annual",
                isPopular = true,
                description = "Maximum value: 1 full year of uncapped radar discovery & CRM automation",
                features = listOf(
                    "Everything in Monthly Access Plan",
                    "365 Days of Uncapped Radar Discovery Access",
                    "Save over 66% compared to monthly billing",
                    "Priority API Data Refresh & Worldwide Indexing",
                    "Priority Customer & Engineering Support",
                    "Multi-Seat Workspace & Collaboration Tools"
                )
            )
        )
    }
}
