package com.webhunt.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UserProfileData(
    val id: String? = null,
    val userId: String? = null,
    val fullName: String = "",
    val professionalTitle: String = "",
    val bio: String? = null,
    val yearsExperience: Int? = null,
    val skills: List<String> = emptyList(),
    val portfolioUrl: String? = null,
    val githubUrl: String? = null,
    val linkedinUrl: String? = null,
    val resumeUrl: String? = null,
    val hourlyRateUsd: Double? = null,
    val hourlyRateKes: Double? = null,
    val projectRateUsd: Double? = null,
    val projectRateKes: Double? = null,
    val currency: String? = "USD",
    val timezone: String? = null,
    val languages: List<String> = emptyList(),
    val phone: String? = null,
    val whatsapp: String? = null,
    val email: String? = null,
    val city: String? = null,
    val country: String? = null,
    val mpesaTillNumber: String? = null,
    val mpesaPaybillNumber: String? = null
)

@Serializable
data class ProfileResponse(
    val success: Boolean,
    val data: UserProfileData? = null,
    val error: String? = null
)
