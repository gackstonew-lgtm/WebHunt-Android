package com.webhunt.app.util

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import com.webhunt.app.data.model.OnlineJobLead
import com.webhunt.app.data.model.PhysicalLead
import java.io.File
import java.io.FileWriter

object CsvExporter {

    fun exportPhysicalLeads(context: Context, leads: List<PhysicalLead>, filenamePrefix: String = "webhunt-physical-leads") {
        if (leads.isEmpty()) return

        val exportDir = File(context.cacheDir, "exports").apply { mkdirs() }
        val file = File(exportDir, "${filenamePrefix}_${System.currentTimeMillis()}.csv")

        FileWriter(file).use { writer ->
            writer.appendLine("Business Name,Category,Phone,Formatted Phone,City,Country,Address,Rating,Review Count,Website Status,Email,WhatsApp,Booking URL,Contact Page,Status,Estimated Value")

            for (l in leads) {
                val row = listOf(
                    escapeCsv(l.businessName),
                    escapeCsv(l.category ?: ""),
                    escapeCsv(l.phone),
                    escapeCsv(l.phoneFormatted ?: ""),
                    escapeCsv(l.city ?: ""),
                    escapeCsv(l.country),
                    escapeCsv(l.address ?: ""),
                    (l.rating ?: "").toString(),
                    (l.reviewCount ?: "").toString(),
                    if (l.hasWebsite) "Has Website" else "No Website (${l.noWebsiteConfidence ?: "High"})",
                    escapeCsv(l.email ?: ""),
                    escapeCsv(l.whatsapp ?: ""),
                    escapeCsv(l.bookingUrl ?: ""),
                    escapeCsv(l.contactPageUrl ?: ""),
                    escapeCsv(l.status),
                    l.estimatedValue.toString()
                )
                writer.appendLine(row.joinToString(","))
            }
        }

        shareFile(context, file, "Exported ${leads.size} Physical Leads")
    }

    fun exportOnlineJobLeads(context: Context, jobs: List<OnlineJobLead>, filenamePrefix: String = "webhunt-remote-jobs") {
        if (jobs.isEmpty()) return

        val exportDir = File(context.cacheDir, "exports").apply { mkdirs() }
        val file = File(exportDir, "${filenamePrefix}_${System.currentTimeMillis()}.csv")

        FileWriter(file).use { writer ->
            writer.appendLine("Title,Company,Location,Remote Type,Salary,Source,URL,Tags,Status,Estimated Value")

            for (j in jobs) {
                val row = listOf(
                    escapeCsv(j.title),
                    escapeCsv(j.company),
                    escapeCsv(j.location),
                    escapeCsv(j.remoteType ?: "worldwide"),
                    escapeCsv(j.salary ?: "Competitive"),
                    escapeCsv(j.source),
                    escapeCsv(j.url),
                    escapeCsv(j.tags.joinToString("; ")),
                    escapeCsv(j.status),
                    j.estimatedValue.toString()
                )
                writer.appendLine(row.joinToString(","))
            }
        }

        shareFile(context, file, "Exported ${jobs.size} Remote Opportunities")
    }

    private fun shareFile(context: Context, file: File, title: String) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/csv"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        context.startActivity(Intent.createChooser(intent, title))
    }

    private fun escapeCsv(text: String): String {
        val clean = text.replace("\"", "\"\"")
        return if (clean.contains(",") || clean.contains("\n") || clean.contains("\"")) {
            "\"$clean\""
        } else {
            clean
        }
    }
}
