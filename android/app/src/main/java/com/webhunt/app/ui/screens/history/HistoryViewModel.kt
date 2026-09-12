package com.webhunt.app.ui.screens.history

import androidx.lifecycle.ViewModel
import com.webhunt.app.data.model.SearchHistoryItem
import com.webhunt.app.data.storage.SearchHistoryManager
import kotlinx.coroutines.flow.StateFlow

class HistoryViewModel(
    private val searchHistoryManager: SearchHistoryManager
) : ViewModel() {

    val history: StateFlow<List<SearchHistoryItem>> = searchHistoryManager.history

    fun clearHistory() {
        searchHistoryManager.clearHistory()
    }
}
