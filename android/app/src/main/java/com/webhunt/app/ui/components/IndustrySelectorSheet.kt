package com.webhunt.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
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
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
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
import com.webhunt.app.data.model.IndustryCategory
import com.webhunt.app.data.model.IndustryDefinition
import com.webhunt.app.ui.theme.WebHuntBlack
import com.webhunt.app.ui.theme.WebHuntBorder
import com.webhunt.app.ui.theme.WebHuntBorderSubtle
import com.webhunt.app.ui.theme.WebHuntCard
import com.webhunt.app.ui.theme.WebHuntEmerald
import com.webhunt.app.ui.theme.WebHuntHover
import com.webhunt.app.ui.theme.WebHuntMuted
import com.webhunt.app.ui.theme.WebHuntPaper
import com.webhunt.app.ui.theme.WebHuntRoyal
import com.webhunt.app.ui.theme.WebHuntSurface

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IndustrySelectorSheet(
    mode: String,
    categories: List<IndustryCategory>,
    industries: List<IndustryDefinition>,
    selectedIndustryIds: List<String>,
    onSelectIndustry: (IndustryDefinition) -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var searchQuery by remember { mutableStateOf("") }
    var activeTab by remember { mutableStateOf("search") } // "search" or "categories"
    var selectedCategoryId by remember {
        mutableStateOf(categories.firstOrNull()?.id ?: "")
    }

    val filteredIndustries = remember(searchQuery, mode, industries) {
        val q = searchQuery.trim().lowercase()
        val modeIndustries = industries.filter { it.applicableModes.contains(mode) }
        if (q.isBlank()) modeIndustries.filter { it.isPopular }
        else modeIndustries.filter {
            it.name.lowercase().contains(q) ||
                    it.aliases.any { a -> a.lowercase().contains(q) } ||
                    it.categoryId.lowercase().contains(q)
        }
    }

    val categoryIndustries = remember(selectedCategoryId, mode, industries) {
        industries.filter {
            it.categoryId.equals(selectedCategoryId, ignoreCase = true) &&
                    it.applicableModes.contains(mode)
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = WebHuntCard,
        contentColor = WebHuntPaper
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f)
                .padding(horizontal = 20.dp, vertical = 8.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = if (mode == "physical") "Target Industry / Business Niche" else "Job Field / Tech Service",
                        color = WebHuntPaper,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Text(
                        text = "Select a verified taxonomy niche for maximum scan accuracy",
                        color = WebHuntMuted,
                        fontSize = 11.sp
                    )
                }

                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(WebHuntHover)
                        .clickable { onDismiss() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = WebHuntMuted,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Search input field
            OutlinedTextField(
                value = searchQuery,
                onValueChange = {
                    searchQuery = it
                    if (it.isNotBlank()) activeTab = "search"
                },
                placeholder = {
                    Text(
                        text = "Search (e.g. Plumbers, Auto Repair, React)...",
                        color = WebHuntMuted.copy(alpha = 0.6f),
                        fontSize = 13.sp
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = WebHuntRoyal,
                        modifier = Modifier.size(18.dp)
                    )
                },
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

            Spacer(modifier = Modifier.height(10.dp))

            // Tabs row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(WebHuntBlack)
                    .border(1.dp, WebHuntBorderSubtle, RoundedCornerShape(10.dp))
                    .padding(3.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (activeTab == "search") WebHuntHover else WebHuntBlack)
                        .clickable { activeTab = "search" }
                        .padding(vertical = 6.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Popular & Search",
                        color = if (activeTab == "search") WebHuntPaper else WebHuntMuted,
                        fontSize = 11.sp,
                        fontWeight = if (activeTab == "search") FontWeight.Bold else FontWeight.Medium
                    )
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (activeTab == "categories") WebHuntHover else WebHuntBlack)
                        .clickable { activeTab = "categories" }
                        .padding(vertical = 6.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Browse Categories",
                        color = if (activeTab == "categories") WebHuntPaper else WebHuntMuted,
                        fontSize = 11.sp,
                        fontWeight = if (activeTab == "categories") FontWeight.Bold else FontWeight.Medium
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (activeTab == "categories") {
                // Category Pills horizontal row
                val modeCategories = categories.filter { it.applicableModes.contains(mode) }
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(modeCategories) { cat ->
                        val isCatSelected = cat.id == selectedCategoryId
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isCatSelected) WebHuntRoyal else WebHuntSurface)
                                .border(1.dp, if (isCatSelected) WebHuntRoyal else WebHuntBorder, RoundedCornerShape(10.dp))
                            .clickable { selectedCategoryId = cat.id }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = cat.name,
                                color = if (isCatSelected) WebHuntPaper else WebHuntMuted,
                                fontSize = 11.sp,
                                fontWeight = if (isCatSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            // Results List
            val displayList = if (activeTab == "categories") categoryIndustries else filteredIndustries

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                if (searchQuery.isNotBlank()) {
                    item {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(WebHuntHover)
                                .border(1.dp, WebHuntRoyal, RoundedCornerShape(12.dp))
                                .clickable {
                                    val customInd = IndustryDefinition(
                                        id = "custom_" + searchQuery.trim().lowercase().replace(Regex("[^a-z0-9]"), "_"),
                                        name = searchQuery.trim(),
                                        categoryId = "custom",
                                        applicableModes = listOf(mode)
                                    )
                                    onSelectIndustry(customInd)
                                    onDismiss()
                                }
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                Icon(
                                    imageVector = Icons.Default.Search,
                                    contentDescription = "Search",
                                    tint = WebHuntRoyal,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        text = "Search for: \"${searchQuery.trim()}\"",
                                        color = WebHuntPaper,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                    Text(
                                        text = "Execute custom tokenized radar query",
                                        color = WebHuntEmerald,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }
                }

                items(displayList) { ind ->
                    val isSelected = selectedIndustryIds.contains(ind.id)

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isSelected) WebHuntHover else WebHuntSurface)
                            .border(1.dp, if (isSelected) WebHuntRoyal else WebHuntBorderSubtle, RoundedCornerShape(12.dp))
                            .clickable {
                                onSelectIndustry(ind)
                                onDismiss()
                            }
                            .padding(horizontal = 14.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = ind.name,
                                color = WebHuntPaper,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                            if (ind.aliases.isNotEmpty()) {
                                Text(
                                    text = ind.aliases.take(3).joinToString(", "),
                                    color = WebHuntMuted,
                                    fontSize = 10.sp,
                                    maxLines = 1
                                )
                            }
                        }

                        if (isSelected) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Selected",
                                tint = WebHuntEmerald,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
