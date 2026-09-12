package com.webhunt.app.ui.screens.pipeline

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Store
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.webhunt.app.data.model.OnlineJobLead
import com.webhunt.app.data.model.PhysicalLead
import com.webhunt.app.ui.components.JobProposalDialog
import com.webhunt.app.ui.components.LeadNotesDialog
import com.webhunt.app.ui.components.PitchScriptDialog
import com.webhunt.app.ui.theme.WebHuntBlack
import com.webhunt.app.ui.theme.WebHuntBorder
import com.webhunt.app.ui.theme.WebHuntBorderSubtle
import com.webhunt.app.ui.theme.WebHuntCard
import com.webhunt.app.ui.theme.WebHuntEmerald
import com.webhunt.app.ui.theme.WebHuntEmeraldTint
import com.webhunt.app.ui.theme.WebHuntHover
import com.webhunt.app.ui.theme.WebHuntMuted
import com.webhunt.app.ui.theme.WebHuntPaper
import com.webhunt.app.ui.theme.WebHuntRoyal
import com.webhunt.app.ui.theme.WebHuntSurface
import com.webhunt.app.util.CsvExporter
import com.webhunt.app.util.Formatters
import com.webhunt.app.util.IntentUtils

data class StageTabItem(val key: String, val label: String)

val SALES_STAGES = listOf(
    StageTabItem("ALL", "All Leads"),
    StageTabItem("NEW", "Inbox (New)"),
    StageTabItem("CONTACTED", "Contacted"),
    StageTabItem("INTERESTED", "Pitch Sent"),
    StageTabItem("CLOSED", "Won / Closed"),
    StageTabItem("NOT_INTERESTED", "Archived")
)

val JOB_STAGES = listOf(
    StageTabItem("ALL", "All Jobs"),
    StageTabItem("SAVED", "Saved"),
    StageTabItem("PREPARING", "Preparing"),
    StageTabItem("APPLIED", "Applied"),
    StageTabItem("INTERVIEW", "Interview"),
    StageTabItem("OFFER", "Offer"),
    StageTabItem("REJECTED", "Archived")
)

data class ActiveNotesTarget(
    val leadId: String,
    val title: String,
    val status: String,
    val notes: String,
    val value: Double
)

@Composable
fun PipelineScreen(
    viewModel: PipelineViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val state by viewModel.uiState.collectAsState()
    val physicalLeads by viewModel.physicalLeads.collectAsState()
    val onlineLeads by viewModel.onlineLeads.collectAsState()
    val stats by viewModel.stats.collectAsState()
    val profile by viewModel.userProfile.collectAsState()

    var activePitchLead by remember { mutableStateOf<PhysicalLead?>(null) }
    var activeProposalJob by remember { mutableStateOf<OnlineJobLead?>(null) }
    var activeNotesTarget by remember { mutableStateOf<ActiveNotesTarget?>(null) }

    val isSales = state.pipelineMode == "sales"
    val stageTabs = if (isSales) SALES_STAGES else JOB_STAGES

    val displayedPhysical = physicalLeads.filter {
        state.activeStageTab == "ALL" || it.status.equals(state.activeStageTab, ignoreCase = true)
    }
    val displayedOnline = onlineLeads.filter {
        state.activeStageTab == "ALL" || it.status.equals(state.activeStageTab, ignoreCase = true)
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(WebHuntBlack)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Metrics Summary Row
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Card 1: Pipeline Volume
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(16.dp))
                        .background(WebHuntCard)
                        .border(1.dp, WebHuntBorder, RoundedCornerShape(16.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Text(text = "VOLUME", color = WebHuntMuted, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = stats.totalLeads.toString(),
                            color = WebHuntPaper,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    }
                }

                // Card 2: Estimated Value
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(16.dp))
                        .background(WebHuntCard)
                        .border(1.dp, WebHuntBorder, RoundedCornerShape(16.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Text(text = "PIPELINE VALUE", color = WebHuntMuted, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = Formatters.formatCurrency(stats.totalEstimatedValue, state.currencyMode),
                            color = WebHuntEmerald,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            maxLines = 1
                        )
                    }
                }

                // Card 3: Contacted / Applied
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(16.dp))
                        .background(WebHuntCard)
                        .border(1.dp, WebHuntBorder, RoundedCornerShape(16.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Text(text = "CONTACTED", color = WebHuntMuted, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = stats.contactedCount.toString(),
                            color = WebHuntPaper,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    }
                }
            }
        }

        // Mode Switcher (Sales Leads CRM vs Remote Jobs Tracker)
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(WebHuntCard)
                    .border(1.dp, WebHuntBorder, RoundedCornerShape(14.dp))
                    .padding(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (isSales) WebHuntRoyal else WebHuntCard)
                        .clickable { viewModel.setPipelineMode("sales") }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Store, contentDescription = null, tint = if (isSales) WebHuntPaper else WebHuntMuted, modifier = Modifier.size(15.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Sales Leads (${physicalLeads.size})",
                            color = if (isSales) WebHuntPaper else WebHuntMuted,
                            fontWeight = if (isSales) FontWeight.Bold else FontWeight.Medium,
                            fontSize = 12.sp
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (!isSales) WebHuntRoyal else WebHuntCard)
                        .clickable { viewModel.setPipelineMode("jobs") }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Terminal, contentDescription = null, tint = if (!isSales) WebHuntPaper else WebHuntMuted, modifier = Modifier.size(15.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Job Tracker (${onlineLeads.size})",
                            color = if (!isSales) WebHuntPaper else WebHuntMuted,
                            fontWeight = if (!isSales) FontWeight.Bold else FontWeight.Medium,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        // Stage Filter Tabs
        item {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(stageTabs) { tab ->
                    val isTabSelected = tab.key == state.activeStageTab
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isTabSelected) WebHuntHover else WebHuntSurface)
                            .border(1.dp, if (isTabSelected) WebHuntRoyal else WebHuntBorderSubtle, RoundedCornerShape(10.dp))
                            .clickable { viewModel.setStageTab(tab.key) }
                            .padding(horizontal = 12.dp, vertical = 7.dp)
                    ) {
                        Text(
                            text = tab.label,
                            color = if (isTabSelected) WebHuntPaper else WebHuntMuted,
                            fontSize = 11.sp,
                            fontWeight = if (isTabSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }
        }

        // Export CSV & Refresh Header Strip
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (isSales) "Showing ${displayedPhysical.size} Leads" else "Showing ${displayedOnline.size} Applications",
                    color = WebHuntMuted,
                    fontSize = 11.sp
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Export CSV
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(WebHuntHover)
                            .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(8.dp))
                            .clickable {
                                if (isSales) CsvExporter.exportPhysicalLeads(context, displayedPhysical, "pipeline-sales")
                                else CsvExporter.exportOnlineJobLeads(context, displayedOnline, "pipeline-jobs")
                            }
                            .padding(horizontal = 10.dp, vertical = 5.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.Download, contentDescription = null, tint = WebHuntMuted, modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "Export CSV", color = WebHuntPaper, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    // Refresh button
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(WebHuntHover)
                            .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(8.dp))
                            .clickable { viewModel.refresh() }
                            .padding(horizontal = 8.dp, vertical = 5.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh", tint = WebHuntMuted, modifier = Modifier.size(14.dp))
                    }
                }
            }
        }

        // Leads Content
        if (state.isLoading) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = WebHuntRoyal, modifier = Modifier.size(32.dp))
                }
            }
        } else if (isSales) {
            if (displayedPhysical.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(WebHuntCard)
                            .border(1.dp, WebHuntBorder, RoundedCornerShape(20.dp))
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(imageVector = Icons.Default.Layers, contentDescription = null, tint = WebHuntMuted, modifier = Modifier.size(36.dp))
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(text = "No saved sales leads in this stage", color = WebHuntPaper, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "Launch a Physical Radar scan on the Radar tab to discover and save leads.", color = WebHuntMuted, fontSize = 11.sp)
                        }
                    }
                }
            } else {
                items(displayedPhysical, key = { it.id }) { lead ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(18.dp))
                            .background(WebHuntCard)
                            .border(1.dp, WebHuntBorder, RoundedCornerShape(18.dp))
                            .padding(16.dp)
                    ) {
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = lead.businessName, color = WebHuntPaper, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(text = "${lead.category ?: "Business"} • ${lead.city ?: lead.country}", color = WebHuntMuted, fontSize = 11.sp)
                                }

                                // Status Pill
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(WebHuntHover)
                                        .border(1.dp, WebHuntBorder, RoundedCornerShape(8.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(text = lead.status, color = WebHuntEmerald, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            // Phone & Value row
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.clickable { IntentUtils.dialPhoneNumber(context, lead.phone) }
                                ) {
                                    Icon(imageVector = Icons.Default.Phone, contentDescription = null, tint = WebHuntEmerald, modifier = Modifier.size(13.dp))
                                    Spacer(modifier = Modifier.width(5.dp))
                                    Text(text = lead.phoneFormatted ?: lead.phone, color = WebHuntPaper, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                                }

                                Text(
                                    text = Formatters.formatCurrency(lead.estimatedValue, state.currencyMode),
                                    color = WebHuntPaper,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 12.sp
                                )
                            }

                            // Notes preview
                            if (!lead.notes.isNullOrBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(WebHuntSurface)
                                        .padding(8.dp)
                                ) {
                                    Text(text = lead.notes, color = WebHuntMuted, fontSize = 11.sp, maxLines = 2)
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            // Action buttons
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // Pitch script
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(WebHuntHover)
                                        .border(1.dp, WebHuntBorder, RoundedCornerShape(10.dp))
                                        .clickable { activePitchLead = lead }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(imageVector = Icons.Default.RecordVoiceOver, contentDescription = null, tint = WebHuntRoyal, modifier = Modifier.size(13.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(text = "Pitch", color = WebHuntPaper, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                }

                                // Quick WhatsApp
                                val targetWa = lead.whatsapp ?: if (lead.phone.isNotBlank()) lead.phone else null
                                if (!targetWa.isNullOrBlank()) {
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(WebHuntEmeraldTint)
                                            .border(1.dp, WebHuntEmerald.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                                            .clickable {
                                                val msg = "Hi ${lead.businessName}, are you currently taking on new clients?"
                                                IntentUtils.openWhatsApp(context, targetWa, msg)
                                            }
                                            .padding(vertical = 8.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(text = "WhatsApp", color = WebHuntEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }

                                // Edit Details & Stage
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(WebHuntSurface)
                                        .border(1.dp, WebHuntBorder, RoundedCornerShape(10.dp))
                                        .clickable {
                                            activeNotesTarget = ActiveNotesTarget(
                                                leadId = lead.id,
                                                title = lead.businessName,
                                                status = lead.status,
                                                notes = lead.notes ?: "",
                                                value = lead.estimatedValue
                                            )
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(imageVector = Icons.Default.EditNote, contentDescription = "Edit", tint = WebHuntMuted, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Online Jobs List
            if (displayedOnline.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(WebHuntCard)
                            .border(1.dp, WebHuntBorder, RoundedCornerShape(20.dp))
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(imageVector = Icons.Default.Terminal, contentDescription = null, tint = WebHuntMuted, modifier = Modifier.size(36.dp))
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(text = "No saved remote job applications", color = WebHuntPaper, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "Launch an Online Gigs radar scan to save opportunities to your tracker.", color = WebHuntMuted, fontSize = 11.sp)
                        }
                    }
                }
            } else {
                items(displayedOnline, key = { it.id }) { job ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(18.dp))
                            .background(WebHuntCard)
                            .border(1.dp, WebHuntBorder, RoundedCornerShape(18.dp))
                            .padding(16.dp)
                    ) {
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = job.title, color = WebHuntPaper, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(text = "${job.company} • ${job.location}", color = WebHuntMuted, fontSize = 11.sp)
                                }

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(WebHuntHover)
                                        .border(1.dp, WebHuntBorder, RoundedCornerShape(8.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(text = job.status, color = WebHuntRoyal, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // Proposal
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(WebHuntHover)
                                        .border(1.dp, WebHuntBorder, RoundedCornerShape(10.dp))
                                        .clickable { activeProposalJob = job }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null, tint = WebHuntRoyal, modifier = Modifier.size(13.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(text = "Proposal", color = WebHuntPaper, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                }

                                // Apply Link
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(WebHuntSurface)
                                        .border(1.dp, WebHuntBorder, RoundedCornerShape(10.dp))
                                        .clickable { IntentUtils.openBrowser(context, job.url) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(imageVector = Icons.Default.OpenInNew, contentDescription = "Apply", tint = WebHuntMuted, modifier = Modifier.size(16.dp))
                                }

                                // Edit details
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(WebHuntSurface)
                                        .border(1.dp, WebHuntBorder, RoundedCornerShape(10.dp))
                                        .clickable {
                                            activeNotesTarget = ActiveNotesTarget(
                                                leadId = job.id,
                                                title = "${job.title} @ ${job.company}",
                                                status = job.status,
                                                notes = job.notes ?: "",
                                                value = job.estimatedValue
                                            )
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(imageVector = Icons.Default.EditNote, contentDescription = "Edit", tint = WebHuntMuted, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Pitch Script Dialog
    activePitchLead?.let { lead ->
        PitchScriptDialog(
            lead = lead,
            profile = profile,
            onDismiss = { activePitchLead = null }
        )
    }

    // Job Proposal Dialog
    activeProposalJob?.let { job ->
        JobProposalDialog(
            job = job,
            profile = profile,
            onDismiss = { activeProposalJob = null }
        )
    }

    // Lead Notes Dialog
    activeNotesTarget?.let { target ->
        LeadNotesDialog(
            leadId = target.leadId,
            title = target.title,
            currentStatus = target.status,
            currentNotes = target.notes,
            currentValue = target.value,
            onSave = { id, notes, value, status ->
                viewModel.updateLeadNotesAndValue(id, notes, value, status)
            },
            onDelete = { id ->
                viewModel.deleteLead(id)
            },
            onDismiss = { activeNotesTarget = null }
        )
    }
}
