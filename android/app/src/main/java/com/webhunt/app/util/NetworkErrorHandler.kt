package com.webhunt.app.util

import android.util.Log
import com.webhunt.app.BuildConfig
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.Response
import java.io.IOException
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

object NetworkErrorHandler {

    private const val TAG = "WebHuntNetwork"

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    /**
     * Extracts a user-friendly error message from a Throwable, preventing raw network
     * or technical exceptions (such as "failed to connect to /10.0.2.2...") from reaching the user.
     */
    fun getReadableErrorMessage(throwable: Throwable, defaultMessage: String = "Operation failed"): String {
        if (BuildConfig.DEBUG) {
            Log.e(TAG, "Network operation failed: ${throwable.javaClass.simpleName} - ${throwable.message}", throwable)
        }

        return when (throwable) {
            is UnknownHostException -> {
                "Unable to connect to WebHunt servers. Please check your internet connection."
            }
            is SocketTimeoutException -> {
                "Connection timed out. Please check your network speed and try again."
            }
            is ConnectException -> {
                "Unable to reach the WebHunt server. Please verify your internet connection."
            }
            is IOException -> {
                val msg = throwable.message.orEmpty()
                if (msg.contains("10.0.2.2", ignoreCase = true) || msg.contains("failed to connect", ignoreCase = true)) {
                    "Unable to connect to WebHunt. Please check your internet connection and try again."
                } else {
                    "Network error. Please check your connection and try again."
                }
            }
            else -> {
                val msg = throwable.message.orEmpty().trim()
                if (isTechnicalException(msg)) {
                    "Unable to communicate with WebHunt. Please try again."
                } else if (msg.isNotBlank()) {
                    msg
                } else {
                    defaultMessage
                }
            }
        }
    }

    /**
     * Extracts a user-friendly error message from a failed Retrofit Response.
     */
    fun <T> getHttpErrorMessage(response: Response<T>, fallbackMessage: String = "Request failed"): String {
        val code = response.code()
        val rawBody = try {
            response.errorBody()?.string()?.trim()
        } catch (_: Exception) {
            null
        }

        if (BuildConfig.DEBUG) {
            Log.w(TAG, "HTTP $code error response: $rawBody")
        }

        // Try extracting json "error" or "message" field if not HTML
        val jsonError = parseJsonErrorMessage(rawBody)
        if (!jsonError.isNullOrBlank() && !isTechnicalException(jsonError)) {
            return jsonError
        }

        return when (code) {
            400 -> jsonError ?: "Invalid request. Please check your input."
            401 -> "Authentication required. Please sign in to continue."
            402 -> jsonError ?: "Active subscription required. Please subscribe to unlock Lead Radar scans."
            403 -> "Access denied. Your account does not have permission for this action."
            404 -> "Requested resource was not found on WebHunt servers."
            423 -> jsonError ?: "Account temporarily locked. Please wait and try again."
            429 -> "Too many requests. Please wait a moment before trying again."
            500, 502, 503, 504 -> "WebHunt service is currently experiencing issues. Please try again shortly."
            else -> fallbackMessage
        }
    }

    private fun parseJsonErrorMessage(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        if (raw.startsWith("<")) return null // Raw HTML page, ignore

        return try {
            val element = json.parseToJsonElement(raw)
            val obj = element.jsonObject
            val errorVal = obj["error"]?.jsonPrimitive?.content
            val messageVal = obj["message"]?.jsonPrimitive?.content
            errorVal ?: messageVal
        } catch (_: Exception) {
            null
        }
    }

    private fun isTechnicalException(msg: String): Boolean {
        val lower = msg.lowercase()
        return lower.contains("10.0.2.2") ||
                lower.contains("failed to connect to") ||
                lower.contains("connection refused") ||
                lower.contains("route to host") ||
                lower.contains("econnrefused") ||
                lower.contains("sslhandshakeexception") ||
                lower.contains("end of input at line") ||
                lower.contains("<!doctype") ||
                lower.contains("<html")
    }
}
