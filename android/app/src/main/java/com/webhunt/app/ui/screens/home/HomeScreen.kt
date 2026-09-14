package com.webhunt.app.ui.screens.home

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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Store
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.webhunt.app.data.model.OnlineJobLead
import com.webhunt.app.data.model.PhysicalLead
import com.webhunt.app.ui.components.CountryPickerSheet
import com.webhunt.app.ui.components.IndustrySelectorSheet
import com.webhunt.app.ui.components.JobProposalDialog
import com.webhunt.app.ui.components.OnlineJobCard
import com.webhunt.app.ui.components.PhysicalLeadCard
import com.webhunt.app.ui.components.PitchScriptDialog
import com.webhunt.app.ui.components.SearchModeToggle
import com.webhunt.app.ui.theme.WebHuntBlack
import com.webhunt.app.ui.theme.WebHuntBlueBadge
import com.webhunt.app.ui.theme.WebHuntBorder
import com.webhunt.app.ui.theme.WebHuntBorderSubtle
import com.webhunt.app.ui.theme.WebHuntCard
import com.webhunt.app.ui.theme.WebHuntEmerald
import com.webhunt.app.ui.theme.WebHuntHover
import com.webhunt.app.ui.theme.WebHuntMuted
import com.webhunt.app.ui.theme.WebHuntPaper
import com.webhunt.app.ui.theme.WebHuntRed
import com.webhunt.app.ui.theme.WebHuntRedDark
import com.webhunt.app.ui.theme.WebHuntRoyal
import com.webhunt.app.ui.theme.WebHuntRoyalHover
import com.webhunt.app.ui.theme.WebHuntSurface
import com.webhunt.app.util.CsvExporter

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onNavigateToAuth: () -> Unit,
    onNavigateToSubscription: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val state by viewModel.uiState.collectAsState()
    val categories by viewModel.categories.collectAsState()
    val industries by viewModel.industries.collectAsState()
    val countries by viewModel.countries.collectAsState()
    val savedIds by viewModel.savedLeadIds.collectAsState()
    val profile by viewModel.userProfile.collectAsState()

    var showIndustrySheet by remember { mutableStateOf(false) }
    var showCountrySheet by remember { mutableStateOf(false) }
    var activePitchLead by remember { mutableStateOf<PhysicalLead?>(null) }
    var activeProposalJob by remember { mutableStateOf<OnlineJobLead?>(null) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(WebHuntBlack)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Hero Search Form Container
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
                    // Badge Header
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(WebHuntHover)
                            .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(20.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = "Radar",
                            tint = WebHuntRoyal,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Multi-Channel Lead Discovery Radar",
                            color = WebHuntMuted,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Discover High-Conversion Leads",
                        color = WebHuntPaper,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        letterSpacing = (-0.3).sp
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Dual Mode Switcher
                    SearchModeToggle(
                        mode = state.mode,
                        onModeChange = { viewModel.setMode(it) }
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    if (state.mode == "physical") {
                        // Target Industry Selector
                        Text(
                            text = "TARGET INDUSTRY / BUSINESS TYPE",
                            color = WebHuntMuted,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(WebHuntSurface)
                                .border(1.dp, WebHuntBorder, RoundedCornerShape(12.dp))
                                .clickable { showIndustrySheet = true }
                                .padding(horizontal = 14.dp, vertical = 12.dp)
                        ) {
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
                                        imageVector = Icons.Default.Search,
                                        contentDescription = "Industry",
                                        tint = WebHuntRoyal,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = state.niche,
                                        color = WebHuntPaper,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium,
                                        maxLines = 1
                                    )
                                }
                                Icon(
                                    imageVector = Icons.Default.KeyboardArrowDown,
                                    contentDescription = "Open",
                                    tint = WebHuntMuted,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Country Selector
                        Text(
                            text = "TARGET COUNTRY (WORLDWIDE)",
                            color = WebHuntMuted,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(WebHuntSurface)
                                .border(1.dp, WebHuntBorder, RoundedCornerShape(12.dp))
                                .clickable { showCountrySheet = true }
                                .padding(horizontal = 14.dp, vertical = 12.dp)
                        ) {
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
                                        imageVector = Icons.Default.Public,
                                        contentDescription = "Country",
                                        tint = WebHuntRoyal,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = state.country,
                                        color = WebHuntPaper,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                                Icon(
                                    imageVector = Icons.Default.KeyboardArrowDown,
                                    contentDescription = "Open",
                                    tint = WebHuntMuted,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // City / Region (Optional)
                        Text(
                            text = "CITY / REGION / ZIP (OPTIONAL)",
                            color = WebHuntMuted,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = state.city,
                            onValueChange = { viewModel.setCity(it) },
                            placeholder = {
                                Text(
                                    text = "e.g. Nairobi, Mombasa, Austin...",
                                    color = WebHuntMuted.copy(alpha = 0.5f),
                                    fontSize = 13.sp
                                )
                            },
                            singleLine = true,
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = "City",
                                    tint = WebHuntRoyal,
                                    modifier = Modifier.size(16.dp)
                                )
                            },
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
                    } else {
                        // Online Mode Role Selector
                        Text(
                            text = "JOB ROLE, FIELD OR TECH STACK",
                            color = WebHuntMuted,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(WebHuntSurface)
                                .border(1.dp, WebHuntBorder, RoundedCornerShape(12.dp))
                                .clickable { showIndustrySheet = true }
                                .padding(horizontal = 14.dp, vertical = 12.dp)
                        ) {
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
                                        imageVector = Icons.Default.Terminal,
                                        contentDescription = "Job Role",
                                        tint = WebHuntRoyal,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = state.onlineQuery,
                                        color = WebHuntPaper,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium,
                                        maxLines = 1
                                    )
                                }
                                Icon(
                                    imageVector = Icons.Default.KeyboardArrowDown,
                                    contentDescription = "Open",
                                    tint = WebHuntMuted,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Controls row: Fresh Scan Checkbox & Launch Button
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable { viewModel.setForceRefresh(!state.forceRefresh) }
                        ) {
                            Checkbox(
                                checked = state.forceRefresh,
                                onCheckedChange = { viewModel.setForceRefresh(it) },
                                colors = CheckboxDefaults.colors(
                                    checkedColor = WebHuntRoyal,
                                    uncheckedColor = WebHuntBorder,
                                    checkmarkColor = WebHuntPaper
                                )
                            )
                            Text(
                                text = "Fresh Scan",
                                color = WebHuntMuted,
                                fontSize = 11.sp
                            )
                        }

                        // Submit Button
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (state.isLoading) WebHuntRoyalHover else WebHuntRoyal)
                                .clickable(enabled = !state.isLoading) { viewModel.executeSearch() }
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                if (state.isLoading) {
                                    CircularProgressIndicator(
                                        color = WebHuntPaper,
                                        modifier = Modifier.size(14.dp),
                                        strokeWidth = 2.dp
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Scanning...",
                                        color = WebHuntPaper,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                } else {
                                    Text(
                                        text = if (state.mode == "physical") "Launch Local Radar" else "Scan Remote Gigs",
                                        color = WebHuntPaper,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Icon(
                                        imageVector = Icons.Default.ArrowForward,
                                        contentDescription = "Launch",
                                        tint = WebHuntPaper,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Auth Required Notice Banner
        if (state.authRequired) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(WebHuntBlueBadge)
                        .border(1.dp, WebHuntRoyal.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(WebHuntRoyal.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = "Auth",
                                    tint = WebHuntRoyal,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "Sign In Required",
                                    color = WebHuntPaper,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = "Sign in or create an account to launch lead radar scans and save CRM contacts.",
                                    color = WebHuntMuted,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(WebHuntRoyal)
                                .clickable { onNavigateToAuth() }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Sign In / Register",
                                color = WebHuntPaper,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }

        // Subscription Required Notice Banner
        if (state.subscriptionRequired) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(WebHuntBlueBadge)
                        .border(1.dp, WebHuntRoyal.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Active Subscription Pass Required",
                            color = WebHuntPaper,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Choose a subscription pass (Monthly $50 or Annual $200) to launch Lead Radar scans.",
                            color = WebHuntMuted,
                            fontSize = 11.sp
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(WebHuntRoyal)
                                .clickable { onNavigateToSubscription() }
                                .padding(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = "View Subscription Plans",
                                color = WebHuntPaper,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }
        }

        // Error Banner
        if (!state.errorMessage.isNullOrBlank() && !state.authRequired && !state.subscriptionRequired) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(WebHuntRedDark)
                        .border(1.dp, WebHuntRed.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                        .padding(14.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = "Error",
                            tint = WebHuntRed,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = state.errorMessage ?: "",
                            color = WebHuntRed,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }

        // Results Section
        val result = state.searchResult
        if (result != null) {
            item {
                // Results Header Strip
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(WebHuntCard)
                        .border(1.dp, WebHuntBorder, RoundedCornerShape(16.dp))
                        .padding(14.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (result.mode == "physical") Icons.Default.Store else Icons.Default.Terminal,
                                    contentDescription = "Type",
                                    tint = WebHuntRoyal,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (result.mode == "physical")
                                        "Found ${result.physicalLeads.size} Verified Businesses"
                                    else
                                        "Found ${result.onlineLeads.size} Remote Opportunities",
                                    color = WebHuntPaper,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }

                            if (result.fromCache) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(WebHuntHover)
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(text = if (result.staleCache) "Cached (Stale)" else "Cached", color = WebHuntMuted, fontSize = 9.sp)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        // Export CSV & Save All Buttons
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(WebHuntHover)
                                    .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(8.dp))
                                    .clickable {
                                        if (result.mode == "physical") {
                                            CsvExporter.exportPhysicalLeads(context, result.physicalLeads)
                                        } else {
                                            CsvExporter.exportOnlineJobLeads(context, result.onlineLeads)
                                        }
                                    }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Download,
                                        contentDescription = "CSV",
                                        tint = WebHuntMuted,
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(text = "Export CSV", color = WebHuntPaper, fontSize = 11.sp)
                                }
                            }

                            if (result.mode == "physical") {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(WebHuntRoyal)
                                        .clickable { viewModel.bulkSaveAll() }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Bookmark,
                                            contentDescription = "Save All",
                                            tint = WebHuntPaper,
                                            modifier = Modifier.size(13.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(text = "Save All to CRM", color = WebHuntPaper, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Results List
            if (result.mode == "physical") {
                itemsIndexed(
                    items = result.physicalLeads,
                    key = { index, lead -> if (lead.id.isNotBlank()) "${lead.id}_$index" else "phys_${index}_${lead.hashCode()}" }
                ) { _, lead ->
                    PhysicalLeadCard(
                        lead = lead,
                        isSaved = savedIds.contains(lead.id),
                        onSaveClick = { viewModel.savePhysicalLead(it) },
                        onPitchClick = { activePitchLead = it }
                    )
                }
            } else {
                itemsIndexed(
                    items = result.onlineLeads,
                    key = { index, job -> if (job.id.isNotBlank()) "${job.id}_$index" else "job_${index}_${job.hashCode()}" }
                ) { _, job ->
                    OnlineJobCard(
                        job = job,
                        isSaved = savedIds.contains(job.id),
                        onSaveClick = { viewModel.saveOnlineJob(it) },
                        onProposalClick = { activeProposalJob = it }
                    )
                }
            }
        } else {
            // Feature Highlights Grid when empty
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Feature 1
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(WebHuntCard)
                            .border(1.dp, WebHuntBorder, RoundedCornerShape(20.dp))
                            .padding(18.dp)
                    ) {
                        Column {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(WebHuntHover),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(imageVector = Icons.Default.Store, contentDescription = null, tint = WebHuntRoyal, modifier = Modifier.size(18.dp))
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(text = "Worldwide Physical Radar", color = WebHuntPaper, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Find local businesses across Kenya and 240+ countries that have an active phone number but zero website on record to pitch custom websites & POS systems.",
                                color = WebHuntMuted,
                                fontSize = 12.sp,
                                lineHeight = 18.sp
                            )
                        }
                    }

                    // Feature 2
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(WebHuntCard)
                            .border(1.dp, WebHuntBorder, RoundedCornerShape(20.dp))
                            .padding(18.dp)
                    ) {
                        Column {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(WebHuntHover),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(imageVector = Icons.Default.Terminal, contentDescription = null, tint = WebHuntRoyal, modifier = Modifier.size(18.dp))
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(text = "Remote Opportunities Radar", color = WebHuntPaper, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Query official public developer endpoints (Remotive, Arbeitnow, Himalayas, RemoteOK, WWR) for genuine remote software, writing, design, and AI gigs.",
                                color = WebHuntMuted,
                                fontSize = 12.sp,
                                lineHeight = 18.sp
                            )
                        }
                    }

                    // Feature 3
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(WebHuntCard)
                            .border(1.dp, WebHuntBorder, RoundedCornerShape(20.dp))
                            .padding(18.dp)
                    ) {
                        Column {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(WebHuntHover),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(imageVector = Icons.Default.Layers, contentDescription = null, tint = WebHuntRoyal, modifier = Modifier.size(18.dp))
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(text = "In-Session Pipeline CRM", color = WebHuntPaper, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Track outreach stages (New -> Contacted -> Interested -> Closed), generate customized pitch scripts & job proposals, and export to CSV instantly.",
                                color = WebHuntMuted,
                                fontSize = 12.sp,
                                lineHeight = 18.sp
                            )
                        }
                    }
                }
            }
        }
    }

    // Bottom Sheet: Industry Selector
    if (showIndustrySheet) {
        IndustrySelectorSheet(
            mode = state.mode,
            categories = categories,
            industries = industries,
            selectedIndustryIds = if (state.mode == "physical") state.selectedIndustryIds else state.onlineIndustryIds,
            onSelectIndustry = { viewModel.selectIndustry(it) },
            onDismiss = { showIndustrySheet = false }
        )
    }

    // Bottom Sheet: Country Picker
    if (showCountrySheet) {
        CountryPickerSheet(
            countries = countries,
            selectedCountry = state.country,
            onSelectCountry = { viewModel.selectCountry(it) },
            onDismiss = { showCountrySheet = false }
        )
    }

    // Modal: Pitch Script Generator
    activePitchLead?.let { lead ->
        PitchScriptDialog(
            lead = lead,
            profile = profile,
            onDismiss = { activePitchLead = null }
        )
    }

    // Modal: Job Proposal Generator
    activeProposalJob?.let { job ->
        JobProposalDialog(
            job = job,
            profile = profile,
            onDismiss = { activeProposalJob = null }
        )
    }
}
