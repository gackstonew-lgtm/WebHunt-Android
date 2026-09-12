package com.webhunt.app.data.storage

import android.content.Context
import android.content.SharedPreferences
import com.webhunt.app.data.model.SearchHistoryItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SearchHistoryManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(
        "webhunt_search_history_prefs",
        Context.MODE_PRIVATE
    )

    private val json = Json { ignoreUnknownKeys = true }

    private val _history = MutableStateFlow<List<SearchHistoryItem>>(loadHistory())
    val history: StateFlow<List<SearchHistoryItem>> = _history.asStateFlow()

    fun logSearch(
        mode: String,
        query: String,
        location: String,
        provider: String,
        totalFetched: Int,
        qualifiedCount: Int
    ) {
        val current = loadHistory().toMutableList()
        val item = SearchHistoryItem(
            id = "hist_${System.currentTimeMillis()}",
            mode = mode,
            query = query,
            location = location,
            provider = provider,
            totalFetched = totalFetched,
            qualifiedCount = qualifiedCount,
            createdAt = SimpleDateFormat("MMM d, yyyy - HH:mm", Locale.getDefault()).format(Date())
        )

        current.removeAll { it.query.equals(query, ignoreCase = true) }
        current.add(0, item)

        val trimmed = current.take(30)
        saveHistory(trimmed)
        _history.value = trimmed
    }

    fun clearHistory() {
        prefs.edit().remove(KEY_SEARCH_HISTORY).apply()
        _history.value = emptyList()
    }

    private fun loadHistory(): List<SearchHistoryItem> {
        val raw = prefs.getString(KEY_SEARCH_HISTORY, null) ?: return emptyList()
        return try {
            json.decodeFromString<List<SearchHistoryItem>>(raw)
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun saveHistory(list: List<SearchHistoryItem>) {
        try {
            val serialized = json.encodeToString(list)
            prefs.edit().putString(KEY_SEARCH_HISTORY, serialized).apply()
        } catch (e: Exception) {
            // Ignore serialization errors
        }
    }

    companion object {
        private const val KEY_SEARCH_HISTORY = "webhunt_leads_search_history_v1"
    }
}
