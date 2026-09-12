package com.webhunt.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class SubscriptionDetails(
    val id: String,
    val plan: String,
    val status: String,
    val amount: Double,
    val currency: String,
    val startDate: String,
    val endDate: String
)

@Serializable
data class SubscriptionStatusResult(
    val hasActiveSubscription: Boolean = false,
    val isAdmin: Boolean = false,
    val subscription: SubscriptionDetails? = null,
    val plan: String? = null,
    val expiresAt: String? = null,
    val isExpired: Boolean = false
)

@Serializable
data class PaymentPlan(
    val id: String,
    val name: String,
    val amountUsd: Double,
    val amountKes: Double,
    val interval: String,
    val description: String,
    val features: List<String> = emptyList()
)

@Serializable
data class SubscriptionResponse(
    val success: Boolean,
    val plans: List<PaymentPlan> = emptyList(),
    val subscription: SubscriptionStatusResult? = null,
    val error: String? = null
)
