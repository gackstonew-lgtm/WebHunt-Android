package com.webhunt.app.data.api

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

/**
 * Resilient interceptor that handles transient HTTP connection issues,
 * respects Retry-After headers when safe, and isolates provider rate limits without freezing the UI.
 */
class ResilienceInterceptor : Interceptor {

    companion object {
        private const val MAX_TRANSIENT_RETRIES = 2
    }

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        var attempt = 0
        var response: Response? = null
        var lastException: IOException? = null

        while (attempt <= MAX_TRANSIENT_RETRIES) {
            try {
                response?.close() // Close previous response before retry
                response = chain.proceed(request)

                // If success or non-transient status, return immediately
                if (response.isSuccessful || response.code == 401 || response.code == 402 || response.code == 400) {
                    return response
                }

                // If rate-limited (429), respect Retry-After header if short, otherwise return for cache fallback
                if (response.code == 429) {
                    val retryAfterHeader = response.header("Retry-After")
                    val retryAfterSec = retryAfterHeader?.toLongOrNull()
                    if (retryAfterSec != null && retryAfterSec in 1..3 && attempt < MAX_TRANSIENT_RETRIES) {
                        Log.i("ResilienceInterceptor", "HTTP 429 encountered, waiting ${retryAfterSec}s as instructed by server")
                        try {
                            Thread.sleep(retryAfterSec * 1000L)
                        } catch (_: InterruptedException) {
                            Thread.currentThread().interrupt()
                            return response
                        }
                        attempt++
                        continue
                    }
                    // For longer rate limits, return response directly so repository stale-cache handles it
                    return response
                }

                // For 502/503/504 transient gateway errors, retry with exponential backoff
                if (response.code in listOf(502, 503, 504) && attempt < MAX_TRANSIENT_RETRIES) {
                    val backoffMs = (attempt + 1) * 500L
                    Log.w("ResilienceInterceptor", "Transient HTTP ${response.code}, retrying in ${backoffMs}ms (attempt ${attempt + 1})")
                    try {
                        Thread.sleep(backoffMs)
                    } catch (_: InterruptedException) {
                        Thread.currentThread().interrupt()
                        return response
                    }
                    attempt++
                    continue
                }

                return response
            } catch (e: IOException) {
                lastException = e
                if (attempt >= MAX_TRANSIENT_RETRIES) {
                    throw e
                }
                val backoffMs = (attempt + 1) * 500L
                Log.w("ResilienceInterceptor", "Network IOException (${e.message}), retrying in ${backoffMs}ms (attempt ${attempt + 1})")
                try {
                    Thread.sleep(backoffMs)
                } catch (_: InterruptedException) {
                    Thread.currentThread().interrupt()
                    throw e
                }
                attempt++
            }
        }

        return response ?: throw (lastException ?: IOException("Network execution failed after retries"))
    }
}
