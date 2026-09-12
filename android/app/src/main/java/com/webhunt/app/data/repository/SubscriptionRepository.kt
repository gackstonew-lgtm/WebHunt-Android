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
                Result.failure(Exception("Failed to fetch subscription"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    companion object {
        val DEFAULT_PLANS = listOf(
            PaymentPlan(
                id = "monthly",
                name = "Monthly Pro Radar",
                amountUsd = 50.0,
                amountKes = 6500.0,
                interval = "month",
                description = "Unlimited Lead Radar Scans, Full CRM & Outreach Access for 30 days.",
                features = listOf(
                    "Unlimited Worldwide Physical & Remote Radar Scans",
                    "Direct Business Phone Numbers, Emails & WhatsApp Discovery",
                    "Unlimited In-Session Pipeline CRM & CSV Lead Exports",
                    "Tailored Cold Pitch & Proposal Generators with 1-Click Copy"
                )
            ),
            PaymentPlan(
                id = "annual",
                name = "Annual Radar Pass",
                amountUsd = 200.0,
                amountKes = 26000.0,
                interval = "year",
                description = "Complete 365-day access with maximum savings for active freelancers & agencies.",
                features = listOf(
                    "All Monthly Pro Radar Features for 12 Full Months",
                    "Over 65% Annual Discount vs Monthly Billing",
                    "Priority Radar Queue & Fast Parallel Aggregation",
                    "Immediate Access to all Upcoming Provider Connectors"
                )
            )
        )
    }
}
