package com.webhunt.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val name: String? = null,
    val role: String = "user",
    val status: String = "active",
    val isVerified: Boolean = true
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class RegisterRequest(
    val email: String,
    val name: String? = null,
    val password: String
)

@Serializable
data class AuthResponse(
    val success: Boolean,
    val token: String? = null,
    val user: UserDto? = null,
    val error: String? = null
)

@Serializable
data class AuthMeResponse(
    val success: Boolean,
    val authenticated: Boolean = false,
    val user: UserDto? = null,
    val subscription: SubscriptionStatusResult? = null,
    val error: String? = null
)

@Serializable
data class GenericApiResponse(
    val success: Boolean,
    val message: String? = null,
    val error: String? = null
)

@Serializable
data class ForgotPasswordRequest(
    val email: String
)
