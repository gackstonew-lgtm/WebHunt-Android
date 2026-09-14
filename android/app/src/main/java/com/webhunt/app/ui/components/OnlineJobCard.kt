package com.webhunt.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.webhunt.app.data.model.OnlineJobLead
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
import com.webhunt.app.util.Formatters
import com.webhunt.app.util.IntentUtils

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OnlineJobCard(
    job: OnlineJobLead,
    isSaved: Boolean,
    onSaveClick: (OnlineJobLead) -> Unit,
    onProposalClick: (OnlineJobLead) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val employerName = job.displayEmployer
    val sourceLabel = if (job.sources.size > 1) {
        "${job.sources.size} Sources"
    } else {
        job.source.uppercase()
    }

    val (eligibilityLabel, isRegionalHighlight) = when {
        !job.eligibility.isNullOrBlank() -> Pair(job.eligibility, true)
        job.location.contains("Kenya", ignoreCase = true) -> Pair("Kenya Eligible", true)
        job.location.contains("Africa", ignoreCase = true) -> Pair("Africa Eligible", true)
        job.location.contains("EMEA", ignoreCase = true) -> Pair("EMEA Eligible", true)
        job.remoteType.equals("worldwide", ignoreCase = true) ||
                job.location.contains("Anywhere", ignoreCase = true) ||
                job.location.contains("Worldwide", ignoreCase = true) -> Pair("Worldwide Remote", true)
        else -> Pair("Global Remote", false)
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(WebHuntCard)
            .border(1.dp, WebHuntBorder, RoundedCornerShape(20.dp))
            .padding(16.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Header: Company Monogram + Title + Source & Eligibility
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Monogram
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(WebHuntSurface)
                            .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = employerName.take(2).uppercase(),
                            color = WebHuntPaper,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    Column {
                        Text(
                            text = employerName,
                            color = WebHuntPaper,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = "Location",
                                tint = WebHuntRoyal,
                                modifier = Modifier.size(11.dp)
                            )
                            Spacer(modifier = Modifier.width(3.dp))
                            Text(
                                text = job.location,
                                color = WebHuntMuted,
                                fontSize = 10.sp,
                                maxLines = 1
                            )
                        }
                    }
                }

                // Badges Column
                Column(horizontalAlignment = Alignment.End) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(WebHuntHover)
                            .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(6.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = sourceLabel,
                            color = WebHuntMuted,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isRegionalHighlight) WebHuntEmeraldTint else WebHuntHover)
                            .border(1.dp, if (isRegionalHighlight) WebHuntEmerald.copy(alpha = 0.3f) else WebHuntBorder, RoundedCornerShape(6.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = eligibilityLabel,
                            color = if (isRegionalHighlight) WebHuntEmerald else WebHuntRoyal,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Job Title
            Text(
                text = job.title,
                color = WebHuntPaper,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                lineHeight = 20.sp
            )

            // Snippet
            if (!job.descriptionSnippet.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = job.descriptionSnippet,
                    color = WebHuntMuted,
                    fontSize = 11.sp,
                    lineHeight = 16.sp,
                    maxLines = 2
                )
            }

            // Tags & Skills
            val displayTags = job.displaySkills
            if (displayTags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    displayTags.take(6).forEach { tag ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(WebHuntSurface)
                                .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = tag,
                                color = WebHuntMuted,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Salary, Relevance Score & Date
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = job.salary?.takeIf { it.isNotBlank() } ?: "Salary not disclosed",
                        color = WebHuntEmerald,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 12.sp
                    )

                    job.displayOpportunityType?.let { oppType ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(WebHuntHover)
                                .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = oppType,
                                color = WebHuntMuted,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    job.normalizedRelevanceScore?.let { matchPct ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(WebHuntHover)
                                .border(1.dp, WebHuntRoyal.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "$matchPct% Match",
                                color = if (matchPct >= 80) WebHuntEmerald else WebHuntRoyal,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.CalendarToday,
                        contentDescription = "Date",
                        tint = WebHuntMuted,
                        modifier = Modifier.size(11.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = Formatters.formatDate(job.publishedAt ?: job.postedDate),
                        color = WebHuntMuted,
                        fontSize = 10.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Footer Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Proposal Generator
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(WebHuntHover)
                        .border(1.dp, WebHuntBorder, RoundedCornerShape(10.dp))
                        .clickable { onProposalClick(job) }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = "Proposal",
                            tint = WebHuntRoyal,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(5.dp))
                        Text(
                            text = "Proposal",
                            color = WebHuntPaper,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 11.sp
                        )
                    }
                }

                // External Apply Link
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(WebHuntSurface)
                        .border(1.dp, WebHuntBorder, RoundedCornerShape(10.dp))
                        .clickable { IntentUtils.openBrowser(context, job.displayApplicationUrl) },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.OpenInNew,
                        contentDescription = "Apply",
                        tint = WebHuntMuted,
                        modifier = Modifier.size(16.dp)
                    )
                }

                // Save to Pipeline
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (isSaved) WebHuntHover else WebHuntRoyal)
                        .border(1.dp, if (isSaved) WebHuntBorder else WebHuntRoyal, RoundedCornerShape(10.dp))
                        .clickable { onSaveClick(job) }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = if (isSaved) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                            contentDescription = "Save",
                            tint = if (isSaved) WebHuntEmerald else WebHuntPaper,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(5.dp))
                        Text(
                            text = if (isSaved) "Saved" else "Save Job",
                            color = if (isSaved) WebHuntEmerald else WebHuntPaper,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }
    }
}
