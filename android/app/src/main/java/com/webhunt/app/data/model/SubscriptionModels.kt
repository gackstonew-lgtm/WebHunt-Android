package com.webhunt.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class SubscriptionDetails(
    val id: String = "",
    val plan: String = "",
    val status: String = "ACTIVE",
    val amount: Double = 0.0,
    val currency: String = "USD",
    val startDate: String = "",
    val endDate: String = "",
    val daysRemaining: Int = 0,
    val providerReference: String? = null
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
    val id: String = "",
    val name: String = "",
    val tagline: String = "",
    val priceUsd: Double = 0.0,
    val priceKes: Double = 0.0,
    val durationDays: Int = 30,
    val interval: String = "monthly",
    val isPopular: Boolean = false,
    val features: List<String> = emptyList(),
    // Backward compatibility fields
    val amountUsd: Double = 0.0,
    val amountKes: Double = 0.0,
    val description: String = ""
) {
    val displayAmountUsd: Double get() = if (priceUsd > 0.0) priceUsd else amountUsd
    val displayAmountKes: Double get() = if (priceKes > 0.0) priceKes else amountKes
    val displayTagline: String get() = tagline.ifBlank { description }
}

@Serializable
data class SubscriptionResponse(
    val success: Boolean = true,
    val plans: List<PaymentPlan> = emptyList(),
    val subscription: SubscriptionStatusResult? = null,
    val error: String? = null
)
