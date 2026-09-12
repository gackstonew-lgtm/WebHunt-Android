package com.webhunt.app.util

import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object Formatters {

    fun formatCurrency(amount: Double, currency: String = "USD"): String {
        return if (currency.equals("KES", ignoreCase = true)) {
            val format = NumberFormat.getNumberInstance(Locale.US)
            "KES ${format.format(amount.toLong())}"
        } else {
            val format = NumberFormat.getCurrencyInstance(Locale.US)
            format.maximumFractionDigits = 0
            format.format(amount)
        }
    }

    fun formatDate(isoDate: String?): String {
        if (isoDate.isNullOrBlank()) return "Recent"
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
            val date: Date? = inputFormat.parse(isoDate.take(19))
            val outputFormat = SimpleDateFormat("MMM d, yyyy", Locale.US)
            date?.let { outputFormat.format(it) } ?: isoDate.take(10)
        } catch (_: Exception) {
            isoDate.take(10)
        }
    }
}
