package com.webhunt.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UserProfileData(
    val id: String? = null,
    val userId: String? = null,
    val fullName: String = "Gackstone Baraka",
    val professionalTitle: String = "Full-Stack Software Engineer & Solutions Architect",
    val bio: String? = null,
    val yearsExperience: Int? = 4,
    val skills: List<String> = emptyList(),
    val portfolioUrl: String? = null,
    val githubUrl: String? = null,
    val linkedinUrl: String? = null,
    val resumeUrl: String? = null,
    val hourlyRateUsd: Double? = 45.0,
    val hourlyRateKes: Double? = 5000.0,
    val projectRateUsd: Double? = 1500.0,
    val projectRateKes: Double? = 150000.0,
    val currency: String? = "USD",
    val timezone: String? = "Africa/Nairobi (EAT, UTC+3)",
    val languages: List<String> = listOf("English", "Swahili"),
    val phone: String? = null,
    val whatsapp: String? = null,
    val email: String? = null,
    val city: String? = "Nairobi",
    val country: String? = "Kenya",
    val mpesaTillNumber: String? = null,
    val mpesaPaybillNumber: String? = null
)

@Serializable
data class ProfileResponse(
    val success: Boolean,
    val data: UserProfileData? = null,
    val error: String? = null
)
