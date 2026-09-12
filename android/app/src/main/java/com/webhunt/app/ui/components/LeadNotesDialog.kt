package com.webhunt.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.webhunt.app.ui.theme.WebHuntBlack
import com.webhunt.app.ui.theme.WebHuntBorder
import com.webhunt.app.ui.theme.WebHuntCard
import com.webhunt.app.ui.theme.WebHuntHover
import com.webhunt.app.ui.theme.WebHuntMuted
import com.webhunt.app.ui.theme.WebHuntPaper
import com.webhunt.app.ui.theme.WebHuntRed
import com.webhunt.app.ui.theme.WebHuntRoyal
import com.webhunt.app.ui.theme.WebHuntSurface

val ALL_SALES_STAGES = listOf(
    "NEW" to "New Lead",
    "CONTACTED" to "Contacted",
    "INTERESTED" to "Pitch / Proposal Sent",
    "CLOSED" to "Closed / Won",
    "NOT_INTERESTED" to "Archived"
)

@Composable
fun LeadNotesDialog(
    leadId: String,
    title: String,
    currentStatus: String,
    currentNotes: String,
    currentValue: Double,
    onSave: (leadId: String, notes: String, value: Double, status: String) -> Unit,
    onDelete: (leadId: String) -> Unit,
    onDismiss: () -> Unit
) {
    var status by remember { mutableStateOf(currentStatus) }
    var notes by remember { mutableStateOf(currentNotes) }
    var valueStr by remember { mutableStateOf(currentValue.toLong().toString()) }
    var statusMenuOpen by remember { mutableStateOf(false) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .clip(RoundedCornerShape(24.dp))
                .background(WebHuntCard)
                .border(1.dp, WebHuntBorder, RoundedCornerShape(24.dp))
                .padding(20.dp)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(WebHuntHover),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.EditNote,
                                contentDescription = "Edit",
                                tint = WebHuntRoyal,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Lead CRM Details",
                                color = WebHuntPaper,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                            Text(
                                text = title,
                                color = WebHuntMuted,
                                fontSize = 11.sp,
                                maxLines = 1
                            )
                        }
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

                // Status Dropdown
                Text(
                    text = "PIPELINE STAGE",
                    color = WebHuntMuted,
                    fontWeight = FontWeight.Bold,
                    fontSize = 10.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(WebHuntSurface)
                        .border(1.dp, WebHuntBorder, RoundedCornerShape(10.dp))
                        .clickable { statusMenuOpen = true }
                        .padding(horizontal = 14.dp, vertical = 12.dp)
                ) {
                    val label = ALL_SALES_STAGES.firstOrNull { it.first == status }?.second ?: status
                    Text(
                        text = label,
                        color = WebHuntPaper,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )

                    DropdownMenu(
                        expanded = statusMenuOpen,
                        onDismissRequest = { statusMenuOpen = false },
                        modifier = Modifier.background(WebHuntCard)
                    ) {
                        ALL_SALES_STAGES.forEach { (key, name) ->
                            DropdownMenuItem(
                                text = { Text(text = name, color = WebHuntPaper) },
                                onClick = {
                                    status = key
                                    statusMenuOpen = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Estimated Deal Value
                Text(
                    text = "ESTIMATED CONTRACT VALUE ($)",
                    color = WebHuntMuted,
                    fontWeight = FontWeight.Bold,
                    fontSize = 10.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = valueStr,
                    onValueChange = { valueStr = it.filter { ch -> ch.isDigit() } },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
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

                Spacer(modifier = Modifier.height(12.dp))

                // Internal Notes
                Text(
                    text = "OUTREACH & CRM NOTES",
                    color = WebHuntMuted,
                    fontWeight = FontWeight.Bold,
                    fontSize = 10.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    placeholder = { Text("Log call notes, decision maker names, follow-up dates...", color = WebHuntMuted.copy(alpha = 0.5f), fontSize = 12.sp) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp),
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

                Spacer(modifier = Modifier.height(16.dp))

                // Bottom Buttons (Delete vs Save)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(WebHuntHover)
                            .border(1.dp, WebHuntRed.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                            .clickable {
                                onDelete(leadId)
                                onDismiss()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Delete",
                            tint = WebHuntRed,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(WebHuntRoyal)
                            .clickable {
                                val parsedVal = valueStr.toDoubleOrNull() ?: 1500.0
                                onSave(leadId, notes, parsedVal, status)
                                onDismiss()
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Save Changes",
                            color = WebHuntPaper,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}
