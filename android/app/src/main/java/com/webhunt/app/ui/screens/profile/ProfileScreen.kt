package com.webhunt.app.ui.screens.profile

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
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.activity.compose.BackHandler
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Nightlight
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.webhunt.app.data.storage.AppThemeMode
import com.webhunt.app.ui.theme.WebHuntTheme

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onNavigateToSubscription: () -> Unit = {},
    onLogout: () -> Unit = {},
    onBack: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    BackHandler(onBack = onBack)

    val state by viewModel.uiState.collectAsState()
    val themeMode by viewModel.themeMode.collectAsState()
    val p = state.profile
    val colors = WebHuntTheme.colors
    var newSkillText by remember { mutableStateOf("") }

    val displayName = p.fullName.ifBlank { p.email?.substringBefore("@") ?: "User" }
    val initials = displayName
        .split(" ", "_", ".")
        .filter { it.isNotBlank() }
        .mapNotNull { it.firstOrNull() }
        .take(2)
        .joinToString("")
        .uppercase()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(colors.background)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Top Navigation Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(colors.cardElevated)
                        .border(1.dp, colors.border, RoundedCornerShape(10.dp))
                        .clickable { onBack() }
                        .padding(horizontal = 12.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = colors.primaryText,
                        modifier = Modifier.size(15.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Back",
                        color = colors.primaryText,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                if (state.saveSuccess) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(colors.emeraldTint)
                            .border(1.dp, colors.emerald.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                            .clickable { onBack() }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Check, contentDescription = null, tint = colors.emerald, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "Done", color = colors.emerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
        // Identity Header Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(colors.card)
                    .border(1.dp, colors.border, RoundedCornerShape(20.dp))
                    .padding(18.dp)
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(colors.cardElevated)
                                .border(1.dp, colors.borderSubtle, RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "WEBHUNT WORKSPACE",
                                color = colors.mutedText,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp
                            )
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(colors.cardElevated)
                                .border(1.dp, colors.border, RoundedCornerShape(8.dp))
                                .clickable {
                                    viewModel.logout()
                                    onLogout()
                                }
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "Sign out",
                                    color = colors.mutedText,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                                Spacer(modifier = Modifier.width(5.dp))
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                                    contentDescription = "Sign Out",
                                    tint = colors.mutedText,
                                    modifier = Modifier.size(13.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(50.dp)
                                .clip(CircleShape)
                                .background(colors.cardElevated)
                                .border(1.5.dp, colors.border, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = initials.ifEmpty { "W" },
                                color = colors.primaryText,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.width(14.dp))

                        Column {
                            Text(
                                text = p.fullName.ifBlank { p.email?.substringBefore("@") ?: "WebHunt Operator" },
                                color = colors.primaryText,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = p.email ?: "No email registered",
                                color = colors.mutedText,
                                fontSize = 11.sp
                            )
                            if (!p.professionalTitle.isNullOrBlank()) {
                                Text(
                                    text = p.professionalTitle,
                                    color = colors.primaryText,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    modifier = Modifier.padding(top = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // PREFERENCES & APPEARANCE (Theme Mode & Currency)
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Palette,
                        contentDescription = null,
                        tint = colors.mutedText,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "PREFERENCES & APPEARANCE",
                        color = colors.mutedText,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(colors.card)
                        .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        // Theme Mode Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(colors.cardElevated)
                                        .border(1.dp, colors.borderSubtle, RoundedCornerShape(8.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (themeMode == AppThemeMode.DARK) Icons.Default.Nightlight else Icons.Default.LightMode,
                                        contentDescription = null,
                                        tint = colors.primaryText,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = "Theme Mode",
                                        color = colors.primaryText,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = if (themeMode == AppThemeMode.DARK) "Dark Mode (Obsidian)" else "Light Mode (Off-White)",
                                        color = colors.mutedText,
                                        fontSize = 10.sp
                                    )
                                }
                            }

                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(colors.cardElevated)
                                    .border(1.dp, colors.border, RoundedCornerShape(10.dp))
                                    .padding(2.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (themeMode == AppThemeMode.DARK) colors.primaryAction else androidx.compose.ui.graphics.Color.Transparent)
                                        .clickable { viewModel.setThemeMode(AppThemeMode.DARK) }
                                        .padding(horizontal = 10.dp, vertical = 5.dp)
                                ) {
                                    Text(
                                        text = "Dark",
                                        color = if (themeMode == AppThemeMode.DARK) colors.onPrimaryAction else colors.mutedText,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (themeMode == AppThemeMode.LIGHT) colors.primaryAction else androidx.compose.ui.graphics.Color.Transparent)
                                        .clickable { viewModel.setThemeMode(AppThemeMode.LIGHT) }
                                        .padding(horizontal = 10.dp, vertical = 5.dp)
                                ) {
                                    Text(
                                        text = "Light",
                                        color = if (themeMode == AppThemeMode.LIGHT) colors.onPrimaryAction else colors.mutedText,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        // Currency Selector Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(colors.cardElevated)
                                        .border(1.dp, colors.borderSubtle, RoundedCornerShape(8.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AttachMoney,
                                        contentDescription = null,
                                        tint = colors.primaryText,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = "Default Billing Currency",
                                        color = colors.primaryText,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = "Used in proposal drafts and rate cards",
                                        color = colors.mutedText,
                                        fontSize = 10.sp
                                    )
                                }
                            }

                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(colors.cardElevated)
                                    .border(1.dp, colors.border, RoundedCornerShape(10.dp))
                                    .padding(2.dp)
                            ) {
                                val isUsd = (p.currency ?: "USD") == "USD"
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (isUsd) colors.primaryAction else androidx.compose.ui.graphics.Color.Transparent)
                                        .clickable { viewModel.updateField { it.copy(currency = "USD") } }
                                        .padding(horizontal = 9.dp, vertical = 5.dp)
                                ) {
                                    Text(
                                        text = "USD ($)",
                                        color = if (isUsd) colors.onPrimaryAction else colors.mutedText,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (!isUsd) colors.primaryAction else androidx.compose.ui.graphics.Color.Transparent)
                                        .clickable { viewModel.updateField { it.copy(currency = "KES") } }
                                        .padding(horizontal = 9.dp, vertical = 5.dp)
                                ) {
                                    Text(
                                        text = "KES (KSh)",
                                        color = if (!isUsd) colors.onPrimaryAction else colors.mutedText,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
        // SUBSCRIPTION & PAYMENT METHODS
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.CreditCard,
                            contentDescription = null,
                            tint = colors.mutedText,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "SUBSCRIPTION & PAYMENT METHODS",
                            color = colors.mutedText,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )
                    }

                    Text(
                        text = "Kora Gateway Active",
                        color = colors.emerald,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(colors.card)
                        .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "WebHunt Radar Plan",
                                    color = colors.primaryText,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Multi-channel local business discovery & remote gig radar.",
                                    color = colors.mutedText,
                                    fontSize = 10.sp,
                                    modifier = Modifier.padding(top = 2.dp)
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(colors.primaryAction)
                                    .clickable { onNavigateToSubscription() }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.AutoAwesome,
                                        contentDescription = null,
                                        tint = colors.onPrimaryAction,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Upgrade",
                                        color = colors.onPrimaryAction,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Accepted via Kora:",
                                color = colors.mutedText,
                                fontSize = 10.sp
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(colors.inputInset)
                                        .border(1.dp, colors.borderSubtle, RoundedCornerShape(6.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(text = "M-Pesa", color = colors.emerald, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(colors.inputInset)
                                        .border(1.dp, colors.borderSubtle, RoundedCornerShape(6.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(text = "Cards", color = colors.primaryText, fontSize = 9.sp, fontWeight = FontWeight.Medium)
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(colors.inputInset)
                                        .border(1.dp, colors.borderSubtle, RoundedCornerShape(6.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(text = "Bank Transfer", color = colors.mutedText, fontSize = 9.sp, fontWeight = FontWeight.Medium)
                                }
                            }
                        }
                    }
                }
            }
        }

        // PROFESSIONAL IDENTITY
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Work,
                        contentDescription = null,
                        tint = colors.mutedText,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "PROFESSIONAL IDENTITY",
                        color = colors.mutedText,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(colors.card)
                        .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Column {
                            Text(text = "Full Name / Agency", color = colors.mutedText, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = p.fullName,
                                onValueChange = { value -> viewModel.updateField { it.copy(fullName = value) } },
                                placeholder = { Text("Enter your full name or agency", color = colors.mutedText.copy(alpha = 0.5f), fontSize = 11.sp) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = colors.inputInset,
                                    unfocusedContainerColor = colors.inputInset,
                                    focusedTextColor = colors.primaryText,
                                    unfocusedTextColor = colors.primaryText,
                                    focusedBorderColor = colors.border,
                                    unfocusedBorderColor = colors.borderSubtle
                                ),
                                singleLine = true
                            )
                        }

                        Column {
                            Text(text = "Professional Title", color = colors.mutedText, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = p.professionalTitle,
                                onValueChange = { value -> viewModel.updateField { it.copy(professionalTitle = value) } },
                                placeholder = { Text("e.g. Software Engineer, Agency Owner", color = colors.mutedText.copy(alpha = 0.5f), fontSize = 11.sp) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = colors.inputInset,
                                    unfocusedContainerColor = colors.inputInset,
                                    focusedTextColor = colors.primaryText,
                                    unfocusedTextColor = colors.primaryText,
                                    focusedBorderColor = colors.border,
                                    unfocusedBorderColor = colors.borderSubtle
                                ),
                                singleLine = true
                            )
                        }

                        Column {
                            Text(text = "Bio / Value Proposition", color = colors.mutedText, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = p.bio ?: "",
                                onValueChange = { value -> viewModel.updateField { it.copy(bio = value) } },
                                placeholder = { Text("Summary of your technical capabilities and engineering focus...", color = colors.mutedText.copy(alpha = 0.5f), fontSize = 11.sp) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                minLines = 2,
                                maxLines = 4,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = colors.inputInset,
                                    unfocusedContainerColor = colors.inputInset,
                                    focusedTextColor = colors.primaryText,
                                    unfocusedTextColor = colors.primaryText,
                                    focusedBorderColor = colors.border,
                                    unfocusedBorderColor = colors.borderSubtle
                                )
                            )
                        }
                    }
                }
            }
        }

        // VERIFIED SKILLS & TECH STACK
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "VERIFIED SKILLS & TECH STACK",
                    color = colors.mutedText,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )

                Spacer(modifier = Modifier.height(6.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(colors.card)
                        .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = newSkillText,
                                onValueChange = { newSkillText = it },
                                placeholder = { Text("Add skill (e.g. Kotlin, React, Python)", color = colors.mutedText, fontSize = 11.sp) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = colors.inputInset,
                                    unfocusedContainerColor = colors.inputInset,
                                    focusedTextColor = colors.primaryText,
                                    unfocusedTextColor = colors.primaryText,
                                    focusedBorderColor = colors.border,
                                    unfocusedBorderColor = colors.borderSubtle
                                ),
                                singleLine = true
                            )

                            Spacer(modifier = Modifier.width(8.dp))

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(colors.primaryAction)
                                    .clickable {
                                        if (newSkillText.isNotBlank()) {
                                            viewModel.addSkill(newSkillText)
                                            newSkillText = ""
                                        }
                                    }
                                    .padding(horizontal = 14.dp, vertical = 14.dp)
                            ) {
                                Text(
                                    text = "Add",
                                    color = colors.onPrimaryAction,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            p.skills.forEach { skill ->
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(colors.cardElevated)
                                        .border(1.dp, colors.border, RoundedCornerShape(8.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = skill,
                                            color = colors.primaryText,
                                            fontSize = 11.sp
                                        )
                                        Spacer(modifier = Modifier.width(5.dp))
                                        Box(
                                            modifier = Modifier.clickable { viewModel.removeSkill(skill) }
                                        ) {
                                            Text(
                                                text = "×",
                                                color = colors.mutedText,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // COMMERCIAL PRICING & RATES
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "COMMERCIAL PRICING & RATES",
                    color = colors.mutedText,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )

                Spacer(modifier = Modifier.height(6.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(colors.card)
                        .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = "Hourly Rate (USD)", color = colors.mutedText, fontSize = 11.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = if (p.hourlyRateUsd != null && p.hourlyRateUsd > 0.0) p.hourlyRateUsd.toInt().toString() else "",
                                    onValueChange = { v -> viewModel.updateField { it.copy(hourlyRateUsd = v.toDoubleOrNull()) } },
                                    placeholder = { Text("e.g. 50", color = colors.mutedText.copy(alpha = 0.5f), fontSize = 11.sp) },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = colors.inputInset,
                                        unfocusedContainerColor = colors.inputInset,
                                        focusedTextColor = colors.primaryText,
                                        unfocusedTextColor = colors.primaryText,
                                        focusedBorderColor = colors.border,
                                        unfocusedBorderColor = colors.borderSubtle
                                    ),
                                    singleLine = true
                                )
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = "Hourly Rate (KES)", color = colors.mutedText, fontSize = 11.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = if (p.hourlyRateKes != null && p.hourlyRateKes > 0.0) p.hourlyRateKes.toInt().toString() else "",
                                    onValueChange = { v -> viewModel.updateField { it.copy(hourlyRateKes = v.toDoubleOrNull()) } },
                                    placeholder = { Text("e.g. 6500", color = colors.mutedText.copy(alpha = 0.5f), fontSize = 11.sp) },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = colors.inputInset,
                                        unfocusedContainerColor = colors.inputInset,
                                        focusedTextColor = colors.primaryText,
                                        unfocusedTextColor = colors.primaryText,
                                        focusedBorderColor = colors.border,
                                        unfocusedBorderColor = colors.borderSubtle
                                    ),
                                    singleLine = true
                                )
                            }
                        }

                        Column {
                            Text(text = "M-Pesa Buy Goods / Till Number (Optional)", color = colors.mutedText, fontSize = 11.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = p.mpesaTillNumber ?: "",
                                onValueChange = { v -> viewModel.updateField { it.copy(mpesaTillNumber = v) } },
                                placeholder = { Text("e.g. 987654", color = colors.mutedText, fontSize = 11.sp) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = colors.inputInset,
                                    unfocusedContainerColor = colors.inputInset,
                                    focusedTextColor = colors.primaryText,
                                    unfocusedTextColor = colors.primaryText,
                                    focusedBorderColor = colors.border,
                                    unfocusedBorderColor = colors.borderSubtle
                                ),
                                singleLine = true
                            )
                        }
                    }
                }
            }
        }

        // Save Action Button
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.primaryAction)
                    .clickable(enabled = !state.isSaving) { viewModel.saveProfile() }
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                if (state.isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = colors.onPrimaryAction,
                        strokeWidth = 2.dp
                    )
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Save,
                            contentDescription = null,
                            tint = colors.onPrimaryAction,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (state.saveSuccess) "Settings Saved & Synchronized!" else "Save Profile & Settings",
                            color = colors.onPrimaryAction,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }
            }

            if (state.saveSuccess) {
                Spacer(modifier = Modifier.height(10.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(colors.cardElevated)
                        .border(1.dp, colors.border, RoundedCornerShape(12.dp))
                        .clickable { onBack() }
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = null,
                            tint = colors.primaryText,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Return to Workspace / Radar",
                            color = colors.primaryText,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
