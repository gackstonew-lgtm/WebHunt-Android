package com.webhunt.app.data.repository

import com.webhunt.app.data.api.WebHuntApiService
import com.webhunt.app.data.model.AuthMeResponse
import com.webhunt.app.data.model.AuthResponse
import com.webhunt.app.data.model.LoginRequest
import com.webhunt.app.data.model.RegisterRequest
import com.webhunt.app.data.storage.SessionManager

class AuthRepository(
    private val api: WebHuntApiService,
    private val sessionManager: SessionManager
) {
    val isAuthenticated = sessionManager.isAuthenticated
    val currentUser = sessionManager.currentUser

    suspend fun login(email: String, pass: String): Result<AuthResponse> {
        return try {
            val response = api.login(LoginRequest(email = email, password = pass))
            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()!!
                if (body.token != null && body.user != null) {
                    sessionManager.saveSession(body.token, body.user)
                }
                Result.success(body)
            } else {
                val errorMsg = com.webhunt.app.util.NetworkErrorHandler.getHttpErrorMessage(response, "Sign in failed")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            val msg = com.webhunt.app.util.NetworkErrorHandler.getReadableErrorMessage(e, "Sign in failed")
            Result.failure(Exception(msg, e))
        }
    }

    suspend fun register(email: String, name: String?, pass: String): Result<AuthResponse> {
        return try {
            val response = api.register(RegisterRequest(email = email, name = name, password = pass))
            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()!!
                if (body.token != null && body.user != null) {
                    sessionManager.saveSession(body.token, body.user)
                }
                Result.success(body)
            } else {
                val errorMsg = com.webhunt.app.util.NetworkErrorHandler.getHttpErrorMessage(response, "Registration failed")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            val msg = com.webhunt.app.util.NetworkErrorHandler.getReadableErrorMessage(e, "Registration failed")
            Result.failure(Exception(msg, e))
        }
    }

    suspend fun checkAuthStatus(): Result<AuthMeResponse> {
        return try {
            val response = api.getAuthMe()
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.authenticated && body.user != null) {
                    val token = sessionManager.getToken() ?: ""
                    sessionManager.saveSession(token, body.user)
                } else {
                    sessionManager.clearSession()
                }
                Result.success(body)
            } else {
                sessionManager.clearSession()
                val errorMsg = com.webhunt.app.util.NetworkErrorHandler.getHttpErrorMessage(response, "Not authenticated")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            sessionManager.clearSession()
            val msg = com.webhunt.app.util.NetworkErrorHandler.getReadableErrorMessage(e, "Unable to verify session")
            Result.failure(Exception(msg, e))
        }
    }

    suspend fun logout() {
        try {
            api.logout()
        } catch (_: Exception) {}
        sessionManager.clearSession()
    }
}
