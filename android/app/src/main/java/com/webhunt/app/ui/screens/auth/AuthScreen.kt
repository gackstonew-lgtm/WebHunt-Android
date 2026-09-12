package com.webhunt.app.ui.screens.auth

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.webhunt.app.ui.theme.WebHuntBlack
import com.webhunt.app.ui.theme.WebHuntBorder
import com.webhunt.app.ui.theme.WebHuntCard
import com.webhunt.app.ui.theme.WebHuntHover
import com.webhunt.app.ui.theme.WebHuntMuted
import com.webhunt.app.ui.theme.WebHuntPaper
import com.webhunt.app.ui.theme.WebHuntRed
import com.webhunt.app.ui.theme.WebHuntRedDark
import com.webhunt.app.ui.theme.WebHuntRoyal
import com.webhunt.app.ui.theme.WebHuntSurface

@Composable
fun AuthScreen(
    viewModel: AuthViewModel,
    onAuthSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    var passwordVisible by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(WebHuntBlack)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        if (isAuthenticated && currentUser != null) {
            // Already Authenticated Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(WebHuntCard)
                    .border(1.dp, WebHuntBorder, RoundedCornerShape(24.dp))
                    .padding(24.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(WebHuntHover),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(imageVector = Icons.Default.Person, contentDescription = null, tint = WebHuntRoyal, modifier = Modifier.size(28.dp))
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(text = "Currently Signed In", color = WebHuntPaper, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = currentUser!!.email, color = WebHuntMuted, fontSize = 13.sp)

                    Spacer(modifier = Modifier.height(20.dp))

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(WebHuntHover)
                            .border(1.dp, WebHuntRed.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                            .clickable { viewModel.logout() }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.ExitToApp, contentDescription = "Sign Out", tint = WebHuntRed, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "Sign Out", color = WebHuntRed, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }
        } else {
            // Auth Form Container
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(WebHuntCard)
                    .border(1.dp, WebHuntBorder, RoundedCornerShape(24.dp))
                    .padding(24.dp)
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    // Header
                    Text(
                        text = if (state.isSignInTab) "Sign In to WebHunt" else "Create WebHunt Account",
                        color = WebHuntPaper,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        letterSpacing = (-0.3).sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (state.isSignInTab) "Enter your email and password to access your radar" else "Register your workspace account to start discovering leads",
                        color = WebHuntMuted,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Tab switcher
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(WebHuntBlack)
                            .border(1.dp, WebHuntBorder, RoundedCornerShape(12.dp))
                            .padding(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (state.isSignInTab) WebHuntRoyal else WebHuntBlack)
                                .clickable { viewModel.setTab(true) }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Sign In",
                                color = if (state.isSignInTab) WebHuntPaper else WebHuntMuted,
                                fontWeight = if (state.isSignInTab) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 12.sp
                            )
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (!state.isSignInTab) WebHuntRoyal else WebHuntBlack)
                                .clickable { viewModel.setTab(false) }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Register",
                                color = if (!state.isSignInTab) WebHuntPaper else WebHuntMuted,
                                fontWeight = if (!state.isSignInTab) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 12.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Name Field (Register only)
                    if (!state.isSignInTab) {
                        Text(text = "FULL NAME", color = WebHuntMuted, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = state.name,
                            onValueChange = { viewModel.setName(it) },
                            placeholder = { Text("e.g. Jane Doe", color = WebHuntMuted.copy(alpha = 0.5f), fontSize = 13.sp) },
                            leadingIcon = { Icon(imageVector = Icons.Default.Person, contentDescription = null, tint = WebHuntRoyal, modifier = Modifier.size(16.dp)) },
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
                    }

                    // Email Field
                    Text(text = "EMAIL ADDRESS", color = WebHuntMuted, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = state.email,
                        onValueChange = { viewModel.setEmail(it) },
                        placeholder = { Text("developer@agency.com", color = WebHuntMuted.copy(alpha = 0.5f), fontSize = 13.sp) },
                        leadingIcon = { Icon(imageVector = Icons.Default.Email, contentDescription = null, tint = WebHuntRoyal, modifier = Modifier.size(16.dp)) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
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

                    // Password Field
                    Text(text = "PASSWORD", color = WebHuntMuted, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = state.password,
                        onValueChange = { viewModel.setPassword(it) },
                        placeholder = { Text("••••••••••••", color = WebHuntMuted.copy(alpha = 0.5f), fontSize = 13.sp) },
                        leadingIcon = { Icon(imageVector = Icons.Default.Lock, contentDescription = null, tint = WebHuntRoyal, modifier = Modifier.size(16.dp)) },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = "Toggle password",
                                    tint = WebHuntMuted,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        },
                        singleLine = true,
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
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

                    // Error Alert
                    if (!state.errorMessage.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(WebHuntRedDark)
                                .border(1.dp, WebHuntRed.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                                .padding(10.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = WebHuntRed, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(text = state.errorMessage ?: "", color = WebHuntRed, fontSize = 11.sp)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // Submit Button
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (state.isLoading) WebHuntHover else WebHuntRoyal)
                            .clickable(enabled = !state.isLoading) {
                                viewModel.submit(onSuccess = onAuthSuccess)
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(color = WebHuntPaper, modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        } else {
                            Text(
                                text = if (state.isSignInTab) "Sign In" else "Create Free Account",
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
}
