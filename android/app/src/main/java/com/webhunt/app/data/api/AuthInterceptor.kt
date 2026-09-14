package com.webhunt.app.data.api

import com.webhunt.app.data.storage.SessionManager
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val sessionManager: SessionManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = sessionManager.getToken()

        val requestBuilder = originalRequest.newBuilder()
            .header("Accept", "application/json")
            .header("User-Agent", "WebHunt-Android/1.0.0")

        if (!token.isNullOrBlank()) {
            requestBuilder.header("Authorization", "Bearer $token")
        }

        val response = chain.proceed(requestBuilder.build())

        // Handle session expiration: if an authenticated request receives 401, clear local session
        if (response.code == 401 && !token.isNullOrBlank()) {
            val path = originalRequest.url.encodedPath
            if (!path.contains("auth/login") && !path.contains("auth/register")) {
                sessionManager.clearSession()
            }
        }

        return response
    }
}
