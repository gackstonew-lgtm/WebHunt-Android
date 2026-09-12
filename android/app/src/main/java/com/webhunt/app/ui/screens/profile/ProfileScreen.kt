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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Save
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

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    val p = state.profile
    var newSkillText by remember { mutableStateOf("") }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(WebHuntBlack)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(WebHuntCard)
                    .border(1.dp, WebHuntBorder, RoundedCornerShape(24.dp))
                    .padding(20.dp)
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(WebHuntHover),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Default.Person, contentDescription = null, tint = WebHuntRoyal, modifier = Modifier.size(24.dp))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(text = "Freelancer & Developer Profile", color = WebHuntPaper, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text(text = "Used by the Pitch & Proposal generators to generate tailored outreach", color = WebHuntMuted, fontSize = 11.sp)
                        }
                    }

                    if (state.saveSuccess) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(WebHuntEmeraldTint)
                                .border(1.dp, WebHuntEmerald.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                                .padding(10.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = WebHuntEmerald, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(text = "Profile updated successfully!", color = WebHuntEmerald, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Full Name
                    Text(text = "FULL NAME", color = WebHuntMuted, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = p.fullName,
                        onValueChange = { viewModel.updateField { curr -> curr.copy(fullName = it) } },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = WebHuntSurface,
                            unfocusedContainerColor = WebHuntSurface,
                            focusedBorderColor = WebHuntRoyal,
                            unfocusedBorderColor = WebHuntBorder,
                            focusedTextColor = WebHuntPaper,
                            unfocusedTextColor = WebHuntPaper
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Professional Title
                    Text(text = "PROFESSIONAL TITLE", color = WebHuntMuted, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = p.professionalTitle,
                        onValueChange = { viewModel.updateField { curr -> curr.copy(professionalTitle = it) } },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = WebHuntSurface,
                            unfocusedContainerColor = WebHuntSurface,
                            focusedBorderColor = WebHuntRoyal,
                            unfocusedBorderColor = WebHuntBorder,
                            focusedTextColor = WebHuntPaper,
                            unfocusedTextColor = WebHuntPaper
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Location: City & Country
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = "CITY", color = WebHuntMuted, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = p.city ?: "",
                                onValueChange = { viewModel.updateField { curr -> curr.copy(city = it) } },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = WebHuntSurface,
                                    unfocusedContainerColor = WebHuntSurface,
                                    focusedBorderColor = WebHuntRoyal,
                                    unfocusedBorderColor = WebHuntBorder,
                                    focusedTextColor = WebHuntPaper,
                                    unfocusedTextColor = WebHuntPaper
                                ),
                                shape = RoundedCornerShape(12.dp)
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = "COUNTRY", color = WebHuntMuted, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = p.country ?: "",
                                onValueChange = { viewModel.updateField { curr -> curr.copy(country = it) } },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = WebHuntSurface,
                                    unfocusedContainerColor = WebHuntSurface,
                                    focusedBorderColor = WebHuntRoyal,
                                    unfocusedBorderColor = WebHuntBorder,
                                    focusedTextColor = WebHuntPaper,
                                    unfocusedTextColor = WebHuntPaper
                                ),
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Contact: Phone & WhatsApp
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = "PHONE NUMBER", color = WebHuntMuted, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = p.phone ?: "",
                                onValueChange = { viewModel.updateField { curr -> curr.copy(phone = it) } },
                                singleLine = true,
                                placeholder = { Text("+254 700 000 000", color = WebHuntMuted.copy(alpha = 0.4f), fontSize = 12.sp) },
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = WebHuntSurface,
                                    unfocusedContainerColor = WebHuntSurface,
                                    focusedBorderColor = WebHuntRoyal,
                                    unfocusedBorderColor = WebHuntBorder,
                                    focusedTextColor = WebHuntPaper,
                                    unfocusedTextColor = WebHuntPaper
                                ),
                                shape = RoundedCornerShape(12.dp)
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = "WHATSAPP (OPTIONAL)", color = WebHuntMuted, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = p.whatsapp ?: "",
                                onValueChange = { viewModel.updateField { curr -> curr.copy(whatsapp = it) } },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = WebHuntSurface,
                                    unfocusedContainerColor = WebHuntSurface,
                                    focusedBorderColor = WebHuntRoyal,
                                    unfocusedBorderColor = WebHuntBorder,
                                    focusedTextColor = WebHuntPaper,
                                    unfocusedTextColor = WebHuntPaper
                                ),
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Portfolio & GitHub
                    Text(text = "PORTFOLIO URL", color = WebHuntMuted, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = p.portfolioUrl ?: "",
                        onValueChange = { viewModel.updateField { curr -> curr.copy(portfolioUrl = it) } },
                        singleLine = true,
                        placeholder = { Text("https://yourportfolio.com", color = WebHuntMuted.copy(alpha = 0.4f), fontSize = 12.sp) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = WebHuntSurface,
                            unfocusedContainerColor = WebHuntSurface,
                            focusedBorderColor = WebHuntRoyal,
                            unfocusedBorderColor = WebHuntBorder,
                            focusedTextColor = WebHuntPaper,
                            unfocusedTextColor = WebHuntPaper
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Skills Tags
                    Text(text = "TECHNICAL SKILLS & STACK", color = WebHuntMuted, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                    Spacer(modifier = Modifier.height(6.dp))

                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        p.skills.forEach { skill ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(WebHuntHover)
                                    .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(8.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(text = skill, color = WebHuntPaper, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Remove",
                                        tint = WebHuntMuted,
                                        modifier = Modifier
                                            .size(12.dp)
                                            .clickable {
                                                viewModel.updateField { curr ->
                                                    curr.copy(skills = curr.skills.filter { it != skill })
                                                }
                                            }
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = newSkillText,
                            onValueChange = { newSkillText = it },
                            placeholder = { Text("Add skill (e.g. Flutter, Kotlin, Docker)...", color = WebHuntMuted.copy(alpha = 0.5f), fontSize = 12.sp) },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = WebHuntSurface,
                                unfocusedContainerColor = WebHuntSurface,
                                focusedBorderColor = WebHuntRoyal,
                                unfocusedBorderColor = WebHuntBorder,
                                focusedTextColor = WebHuntPaper,
                                unfocusedTextColor = WebHuntPaper
                            ),
                            shape = RoundedCornerShape(10.dp)
                        )

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(WebHuntHover)
                                .border(1.dp, WebHuntBorder, RoundedCornerShape(10.dp))
                                .clickable {
                                    val clean = newSkillText.trim()
                                    if (clean.isNotBlank() && !p.skills.contains(clean)) {
                                        viewModel.updateField { curr -> curr.copy(skills = curr.skills + clean) }
                                        newSkillText = ""
                                    }
                                }
                                .padding(horizontal = 14.dp, vertical = 12.dp)
                        ) {
                            Text(text = "Add", color = WebHuntPaper, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Save Button
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (state.isSaving) WebHuntHover else WebHuntRoyal)
                            .clickable(enabled = !state.isSaving) { viewModel.saveProfile() }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        if (state.isSaving) {
                            CircularProgressIndicator(color = WebHuntPaper, modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        } else {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Save, contentDescription = null, tint = WebHuntPaper, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(text = "Save Profile", color = WebHuntPaper, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
