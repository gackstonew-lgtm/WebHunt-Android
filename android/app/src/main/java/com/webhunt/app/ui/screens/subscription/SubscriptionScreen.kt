package com.webhunt.app.ui.screens.subscription

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.webhunt.app.ui.theme.WebHuntBlack
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
import com.webhunt.app.util.Formatters
import com.webhunt.app.util.IntentUtils

@Composable
fun SubscriptionScreen(
    viewModel: SubscriptionViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val state by viewModel.uiState.collectAsState()
    val plans by viewModel.plans.collectAsState()
    val subStatus by viewModel.subscriptionStatus.collectAsState()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(WebHuntBlack)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Active Status Card (if subscribed or admin)
        if (subStatus.hasActiveSubscription || subStatus.isAdmin) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(WebHuntEmeraldTint)
                        .border(1.dp, WebHuntEmerald.copy(alpha = 0.4f), RoundedCornerShape(20.dp))
                        .padding(18.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(WebHuntEmerald.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = "Active",
                                tint = WebHuntEmerald,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = if (subStatus.isAdmin) "Administrator Full Access" else "Active Subscription Pass",
                                color = WebHuntPaper,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                            Text(
                                text = if (subStatus.isAdmin) "All Lead Radar features permanently unlocked" else "Full access active until ${Formatters.formatDate(subStatus.expiresAt)}",
                                color = WebHuntEmerald,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }
        }

        // Hero Pricing Header
        item {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(WebHuntHover)
                        .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(20.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Stars, contentDescription = null, tint = WebHuntGold, modifier = Modifier.size(13.dp))
                        Spacer(modifier = Modifier.width(5.dp))
                        Text(text = "Lead Radar Access Pass", color = WebHuntMuted, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "Unlock Worldwide Lead Radar",
                    color = WebHuntPaper,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    letterSpacing = (-0.3).sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Launch unlimited scans, discover phone numbers, emails & WhatsApp for businesses without websites worldwide.",
                    color = WebHuntMuted,
                    fontSize = 12.sp,
                    lineHeight = 18.sp
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Currency Toggle (USD vs KES)
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(WebHuntCard)
                        .border(1.dp, WebHuntBorder, RoundedCornerShape(12.dp))
                        .padding(3.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (state.currency == "USD") WebHuntRoyal else WebHuntCard)
                            .clickable { viewModel.setCurrency("USD") }
                            .padding(horizontal = 16.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "USD ($)",
                            color = if (state.currency == "USD") WebHuntPaper else WebHuntMuted,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (state.currency == "KES") WebHuntRoyal else WebHuntCard)
                            .clickable { viewModel.setCurrency("KES") }
                            .padding(horizontal = 16.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "KES (M-Pesa)",
                            color = if (state.currency == "KES") WebHuntPaper else WebHuntMuted,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Plan Cards
        items(plans) { plan ->
            val isSelected = plan.id == state.selectedPlanId
            val amount = if (state.currency == "KES") plan.displayAmountKes else plan.displayAmountUsd
            val priceStr = if (state.currency == "KES") {
                "KES ${amount.toLong()}"
            } else {
                "$${amount.toLong()}"
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(WebHuntCard)
                    .border(
                        width = if (isSelected) 2.dp else 1.dp,
                        color = if (isSelected) WebHuntRoyal else WebHuntBorder,
                        shape = RoundedCornerShape(20.dp)
                    )
                    .clickable { viewModel.selectPlan(plan.id) }
                    .padding(20.dp)
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            val intervalLabel = if (plan.interval.startsWith("year") || plan.interval.startsWith("annual")) "year" else "month"
                            Text(text = plan.name, color = WebHuntPaper, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text(text = "/$intervalLabel", color = WebHuntMuted, fontSize = 11.sp)
                        }

                        Text(text = priceStr, color = WebHuntEmerald, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = plan.displayTagline, color = WebHuntMuted, fontSize = 11.sp, lineHeight = 16.sp)

                    Spacer(modifier = Modifier.height(14.dp))

                    // Feature checkmarks
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        plan.features.forEach { feature ->
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = null,
                                    tint = WebHuntRoyal,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = feature, color = WebHuntPaper, fontSize = 11.sp)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Select Button
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isSelected) WebHuntRoyal else WebHuntHover)
                            .border(1.dp, if (isSelected) WebHuntRoyal else WebHuntBorder, RoundedCornerShape(12.dp))
                            .clickable {
                                // Launch checkout URL via external browser
                                IntentUtils.openBrowser(context, "https://web-hunt-delta.vercel.app/subscription?plan=${plan.id}&currency=${state.currency}")
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (isSelected) "Subscribe Now (${priceStr})" else "Select Plan",
                            color = WebHuntPaper,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }

        // Trust Badges Footer
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(WebHuntSurface)
                    .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(16.dp))
                    .padding(14.dp),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Security, contentDescription = null, tint = WebHuntEmerald, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "Secure Checkout", color = WebHuntMuted, fontSize = 11.sp)
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.CreditCard, contentDescription = null, tint = WebHuntRoyal, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "M-Pesa & Cards", color = WebHuntMuted, fontSize = 11.sp)
                }
            }
        }
    }
}
