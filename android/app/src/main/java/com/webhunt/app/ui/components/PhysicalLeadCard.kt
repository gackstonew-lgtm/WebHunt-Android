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
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.webhunt.app.data.model.PhysicalLead
import com.webhunt.app.ui.theme.WebHuntBorder
import com.webhunt.app.ui.theme.WebHuntBorderSubtle
import com.webhunt.app.ui.theme.WebHuntCard
import com.webhunt.app.ui.theme.WebHuntEmerald
import com.webhunt.app.ui.theme.WebHuntEmeraldTint
import com.webhunt.app.ui.theme.WebHuntGold
import com.webhunt.app.ui.theme.WebHuntHover
import com.webhunt.app.ui.theme.WebHuntMuted
import com.webhunt.app.ui.theme.WebHuntPaper
import com.webhunt.app.ui.theme.WebHuntRoyal
import com.webhunt.app.ui.theme.WebHuntSurface
import com.webhunt.app.util.IntentUtils

import com.webhunt.app.ui.theme.WebHuntRed
import com.webhunt.app.ui.theme.WebHuntRedDark

private data class StatusPillStyle(
    val label: String,
    val background: androidx.compose.ui.graphics.Color,
    val border: androidx.compose.ui.graphics.Color,
    val text: androidx.compose.ui.graphics.Color
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun PhysicalLeadCard(
    lead: PhysicalLead,
    isSaved: Boolean,
    onSaveClick: (PhysicalLead) -> Unit,
    onPitchClick: (PhysicalLead) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val hasValidPhone = lead.isPhoneAvailable

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(WebHuntCard)
            .border(1.dp, WebHuntBorder, RoundedCornerShape(20.dp))
            .padding(16.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Header: Name & Category
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = lead.businessName,
                        color = WebHuntPaper,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        lineHeight = 20.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(WebHuntSurface)
                                .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(6.dp))
                                .padding(horizontal = 7.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = lead.category ?: "Local Business",
                                color = WebHuntMuted,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }

                        // Multi-Source / Provider attribution
                        val sourceLabel = if (lead.sources.size > 1) {
                            "${lead.sources.size} Sources"
                        } else {
                            lead.sourceProvider.uppercase()
                        }
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
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Website Opportunity Engine status pill
                val style = when (lead.websiteStatus?.uppercase()) {
                    "NO_WEBSITE" -> StatusPillStyle("No Website", WebHuntEmeraldTint, WebHuntEmerald.copy(alpha = 0.3f), WebHuntEmerald)
                    "SOCIAL_ONLY" -> StatusPillStyle("Social Only", WebHuntHover, WebHuntRoyal.copy(alpha = 0.3f), WebHuntRoyal)
                    "BROKEN_WEBSITE" -> StatusPillStyle("Broken Link", WebHuntRedDark, WebHuntRed.copy(alpha = 0.3f), WebHuntRed)
                    "WEBSITE_FOUND" -> StatusPillStyle("Website Found", WebHuntHover, WebHuntBorder, WebHuntMuted)
                    else -> if (lead.hasWebsite) {
                        StatusPillStyle("Website Found", WebHuntHover, WebHuntBorder, WebHuntMuted)
                    } else {
                        StatusPillStyle("No Website (${lead.noWebsiteConfidence ?: "High"})", WebHuntEmeraldTint, WebHuntEmerald.copy(alpha = 0.3f), WebHuntEmerald)
                    }
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(style.background)
                        .border(1.dp, style.border, RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = style.label,
                        color = style.text,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Phone Row
            if (hasValidPhone) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(WebHuntSurface)
                        .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(10.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { IntentUtils.dialPhoneNumber(context, lead.phone) }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Phone,
                            contentDescription = "Call",
                            tint = WebHuntEmerald,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = lead.phoneFormatted ?: lead.phone,
                            color = WebHuntPaper,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 12.sp
                        )
                    }

                    Icon(
                        imageVector = Icons.Default.ContentCopy,
                        contentDescription = "Copy phone",
                        tint = WebHuntMuted,
                        modifier = Modifier
                            .size(16.dp)
                            .clickable {
                                IntentUtils.copyToClipboard(context, lead.phone, "Phone number copied")
                            }
                    )
                }
            } else {
                Text(
                    text = "Phone unavailable",
                    color = WebHuntMuted.copy(alpha = 0.5f),
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp
                )
            }

            // Enriched Channels Strip
            val hasEnrichedChannels = !lead.email.isNullOrBlank() ||
                    !lead.whatsapp.isNullOrBlank() ||
                    !lead.bookingUrl.isNullOrBlank() ||
                    !lead.contactPageUrl.isNullOrBlank() ||
                    (lead.socialProfiles != null)

            if (hasEnrichedChannels) {
                Spacer(modifier = Modifier.height(8.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // Direct WhatsApp
                    val targetWa = lead.whatsapp ?: if (hasValidPhone) lead.phone else null
                    if (!targetWa.isNullOrBlank()) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(WebHuntEmeraldTint)
                                .border(1.dp, WebHuntEmerald.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                .clickable { IntentUtils.openWhatsApp(context, targetWa) }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "WhatsApp",
                                color = WebHuntEmerald,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    // Email Channel
                    if (!lead.email.isNullOrBlank()) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(WebHuntHover)
                                .border(1.dp, WebHuntRoyal.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                .clickable { IntentUtils.sendEmail(context, lead.email) }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Email,
                                    contentDescription = "Email",
                                    tint = WebHuntRoyal,
                                    modifier = Modifier.size(12.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = lead.email,
                                    color = WebHuntPaper,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Medium,
                                    maxLines = 1
                                )
                            }
                        }
                    }

                    // Booking Link
                    if (!lead.bookingUrl.isNullOrBlank()) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(WebHuntHover)
                                .border(1.dp, WebHuntBorder, RoundedCornerShape(8.dp))
                                .clickable { IntentUtils.openBrowser(context, lead.bookingUrl) }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.CalendarMonth,
                                    contentDescription = "Book",
                                    tint = WebHuntRoyal,
                                    modifier = Modifier.size(12.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(text = "Book", color = WebHuntPaper, fontSize = 10.sp)
                            }
                        }
                    }

                    // Contact Page
                    if (!lead.contactPageUrl.isNullOrBlank()) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(WebHuntHover)
                                .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(8.dp))
                                .clickable { IntentUtils.openBrowser(context, lead.contactPageUrl) }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Language,
                                    contentDescription = "Web",
                                    tint = WebHuntMuted,
                                    modifier = Modifier.size(12.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(text = "Contact Page", color = WebHuntMuted, fontSize = 10.sp)
                            }
                        }
                    }

                    // Social Badges (FB, IG, LI, TW)
                    lead.socialProfiles?.facebook?.let { url ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(WebHuntHover)
                                .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(6.dp))
                                .clickable { IntentUtils.openBrowser(context, url) }
                                .padding(horizontal = 6.dp, vertical = 3.dp)
                        ) {
                            Text(text = "fb", color = WebHuntMuted, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    lead.socialProfiles?.instagram?.let { url ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(WebHuntHover)
                                .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(6.dp))
                                .clickable { IntentUtils.openBrowser(context, url) }
                                .padding(horizontal = 6.dp, vertical = 3.dp)
                        ) {
                            Text(text = "ig", color = WebHuntMuted, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    lead.socialProfiles?.linkedin?.let { url ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(WebHuntHover)
                                .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(6.dp))
                                .clickable { IntentUtils.openBrowser(context, url) }
                                .padding(horizontal = 6.dp, vertical = 3.dp)
                        ) {
                            Text(text = "in", color = WebHuntMuted, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Location & Rating Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = "Location",
                        tint = WebHuntMuted,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = lead.address ?: "${lead.city ?: ""}, ${lead.country}".trim().trim(','),
                        color = WebHuntMuted,
                        fontSize = 11.sp,
                        maxLines = 1
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    lead.contactQualityScore?.let { score ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(WebHuntHover)
                                .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "${score.toInt()}% Quality",
                                color = if (score >= 70.0) WebHuntEmerald else WebHuntMuted,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    if (lead.rating != null && lead.rating > 0.0) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = "Rating",
                                tint = WebHuntGold,
                                modifier = Modifier.size(13.dp)
                            )
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(
                                text = String.format("%.1f", lead.rating),
                                color = WebHuntPaper,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp
                            )
                            lead.reviewCount?.let { count ->
                                if (count > 0) {
                                    Text(
                                        text = " ($count)",
                                        color = WebHuntMuted,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Footer Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Pitch Script Generator Button
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(WebHuntHover)
                        .border(1.dp, WebHuntBorder, RoundedCornerShape(10.dp))
                        .clickable { onPitchClick(lead) }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.RecordVoiceOver,
                            contentDescription = "Pitch",
                            tint = WebHuntRoyal,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(5.dp))
                        Text(
                            text = "Pitch Script",
                            color = WebHuntPaper,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 11.sp
                        )
                    }
                }

                // Save to Pipeline CRM Button
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (isSaved) WebHuntHover else WebHuntRoyal)
                        .border(1.dp, if (isSaved) WebHuntBorder else WebHuntRoyal, RoundedCornerShape(10.dp))
                        .clickable { onSaveClick(lead) }
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
                            text = if (isSaved) "Saved to CRM" else "Save Lead",
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
