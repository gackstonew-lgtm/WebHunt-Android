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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.webhunt.app.ui.theme.WebHuntTheme

@Composable
fun AuthScreen(
    viewModel: AuthViewModel,
    onAuthSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = WebHuntTheme.colors
    val state by viewModel.uiState.collectAsState()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    var passwordVisible by remember { mutableStateOf(false) }
    var confirmPasswordVisible by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(colors.background)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (isAuthenticated && currentUser != null) {
                // Already Authenticated Card
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .background(colors.card)
                        .border(1.dp, colors.border, RoundedCornerShape(24.dp))
                        .padding(24.dp)
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        val initials = currentUser?.name?.split(" ")
                            ?.mapNotNull { it.firstOrNull()?.toString() }
                            ?.take(2)?.joinToString("")
                            ?: currentUser?.email?.firstOrNull()?.uppercase()
                            ?: "WH"

                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(RoundedCornerShape(20.dp))
                                .background(colors.cardElevated)
                                .border(1.dp, colors.border, RoundedCornerShape(20.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = initials,
                                color = colors.primaryText,
                                fontWeight = FontWeight.Bold,
                                fontSize = 22.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = currentUser?.name?.takeIf { it.isNotBlank() } ?: "Authenticated User",
                            color = colors.primaryText,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = currentUser!!.email,
                            color = colors.mutedText,
                            fontSize = 13.sp
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // Continue to Workspace button
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(colors.primaryAction)
                                .clickable { onAuthSuccess() }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "Continue to Workspace",
                                    color = colors.onPrimaryAction,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Icon(
                                    imageVector = Icons.Default.ArrowForward,
                                    contentDescription = null,
                                    tint = colors.onPrimaryAction,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Sign Out button
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(colors.inputInset)
                                .border(1.dp, colors.red.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                                .clickable { viewModel.logout() }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.ExitToApp,
                                    contentDescription = "Sign Out",
                                    tint = colors.red,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Sign Out",
                                    color = colors.red,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }
                }
            } else {
                // Header badge
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(colors.card)
                        .border(1.dp, colors.border, RoundedCornerShape(20.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(colors.cardElevated),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "WH",
                            color = colors.primaryText,
                            fontWeight = FontWeight.Black,
                            fontSize = 9.sp
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "WebHunt Workspace",
                        color = colors.primaryText,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Heading & Subtitle
                Text(
                    text = when (state.tab) {
                        AuthTab.SIGN_IN -> "Sign In to Your Workspace"
                        AuthTab.REGISTER -> "Create Your WebHunt Account"
                        AuthTab.FORGOT -> "Reset Your Password"
                    },
                    color = colors.primaryText,
                    fontWeight = FontWeight.Bold,
                    fontSize = 22.sp,
                    letterSpacing = (-0.4).sp
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = when (state.tab) {
                        AuthTab.SIGN_IN -> "Access verified physical business radar, live remote tech gigs, and proposal generator."
                        AuthTab.REGISTER -> "Join WebHunt to discover high-value prospects and track multi-channel outreach."
                        AuthTab.FORGOT -> "Enter your registered email address to receive a secure recovery link."
                    },
                    color = colors.mutedText,
                    fontSize = 12.sp,
                    lineHeight = 16.sp,
                    modifier = Modifier.padding(horizontal = 16.dp),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Main Form Card
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .background(colors.card)
                        .border(1.dp, colors.border, RoundedCornerShape(24.dp))
                        .padding(20.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {

                        // Segmented Tab Switcher (only for Sign In / Register)
                        if (state.tab != AuthTab.FORGOT) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(colors.inputInset)
                                    .border(1.dp, colors.borderSubtle, RoundedCornerShape(12.dp))
                                    .padding(4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (state.tab == AuthTab.SIGN_IN) colors.cardElevated else colors.inputInset)
                                        .border(
                                            1.dp,
                                            if (state.tab == AuthTab.SIGN_IN) colors.border else androidx.compose.ui.graphics.Color.Transparent,
                                            RoundedCornerShape(10.dp)
                                        )
                                        .clickable { viewModel.setTab(AuthTab.SIGN_IN) }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "Sign In",
                                        color = if (state.tab == AuthTab.SIGN_IN) colors.primaryText else colors.mutedText,
                                        fontWeight = if (state.tab == AuthTab.SIGN_IN) FontWeight.Bold else FontWeight.Medium,
                                        fontSize = 12.sp
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (state.tab == AuthTab.REGISTER) colors.cardElevated else colors.inputInset)
                                        .border(
                                            1.dp,
                                            if (state.tab == AuthTab.REGISTER) colors.border else androidx.compose.ui.graphics.Color.Transparent,
                                            RoundedCornerShape(10.dp)
                                        )
                                        .clickable { viewModel.setTab(AuthTab.REGISTER) }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "Create Account",
                                        color = if (state.tab == AuthTab.REGISTER) colors.primaryText else colors.mutedText,
                                        fontWeight = if (state.tab == AuthTab.REGISTER) FontWeight.Bold else FontWeight.Medium,
                                        fontSize = 12.sp
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))
                        }

                        // Feedback Banners
                        if (!state.errorMessage.isNullOrBlank()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(colors.red.copy(alpha = 0.15f))
                                    .border(1.dp, colors.red.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                                    .padding(12.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Warning,
                                        contentDescription = null,
                                        tint = colors.red,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = state.errorMessage ?: "",
                                        color = colors.red,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                        }

                        if (!state.successMessage.isNullOrBlank()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(colors.emerald.copy(alpha = 0.15f))
                                    .border(1.dp, colors.emerald.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                                    .padding(12.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = colors.emerald,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = state.successMessage ?: "",
                                        color = colors.emerald,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                        }

                        // Form based on Tab
                        when (state.tab) {
                            AuthTab.SIGN_IN -> {
                                // Email Field
                                Text(
                                    text = "EMAIL ADDRESS",
                                    color = colors.mutedText,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 11.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = state.email,
                                    onValueChange = { viewModel.setEmail(it) },
                                    placeholder = { Text("name@example.com", color = colors.mutedText.copy(alpha = 0.5f), fontSize = 13.sp) },
                                    leadingIcon = { Icon(imageVector = Icons.Default.Email, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(16.dp)) },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = colors.inputInset,
                                        unfocusedContainerColor = colors.inputInset,
                                        focusedBorderColor = colors.primaryAction,
                                        unfocusedBorderColor = colors.border,
                                        focusedTextColor = colors.primaryText,
                                        unfocusedTextColor = colors.primaryText
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )

                                Spacer(modifier = Modifier.height(14.dp))

                                // Password Field Header with "Forgot password?"
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "PASSWORD",
                                        color = colors.mutedText,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 11.sp
                                    )
                                    Text(
                                        text = "Forgot password?",
                                        color = colors.mutedText,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium,
                                        modifier = Modifier.clickable { viewModel.setTab(AuthTab.FORGOT) }
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = state.password,
                                    onValueChange = { viewModel.setPassword(it) },
                                    placeholder = { Text("••••••••", color = colors.mutedText.copy(alpha = 0.5f), fontSize = 13.sp) },
                                    leadingIcon = { Icon(imageVector = Icons.Default.Lock, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(16.dp)) },
                                    trailingIcon = {
                                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                            Icon(
                                                imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                                contentDescription = "Toggle password",
                                                tint = colors.mutedText,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    },
                                    singleLine = true,
                                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = colors.inputInset,
                                        unfocusedContainerColor = colors.inputInset,
                                        focusedBorderColor = colors.primaryAction,
                                        unfocusedBorderColor = colors.border,
                                        focusedTextColor = colors.primaryText,
                                        unfocusedTextColor = colors.primaryText
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )

                                Spacer(modifier = Modifier.height(18.dp))

                                // Sign In Submit Button
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (state.isLoading) colors.cardElevated else colors.primaryAction)
                                        .clickable(enabled = !state.isLoading) {
                                            viewModel.submit(onSuccess = onAuthSuccess)
                                        }
                                        .padding(vertical = 12.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (state.isLoading) {
                                        CircularProgressIndicator(
                                            color = colors.onPrimaryAction,
                                            modifier = Modifier.size(16.dp),
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = "Sign In",
                                                color = colors.onPrimaryAction,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.sp
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Icon(
                                                imageVector = Icons.Default.ArrowForward,
                                                contentDescription = null,
                                                tint = colors.onPrimaryAction,
                                                modifier = Modifier.size(14.dp)
                                            )
                                        }
                                    }
                                }
                            }

                            AuthTab.REGISTER -> {
                                // Full Name / Agency Name
                                Text(
                                    text = "FULL NAME / AGENCY NAME",
                                    color = colors.mutedText,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 11.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = state.name,
                                    onValueChange = { viewModel.setName(it) },
                                    placeholder = { Text("e.g. Jane Doe / Agency", color = colors.mutedText.copy(alpha = 0.5f), fontSize = 13.sp) },
                                    leadingIcon = { Icon(imageVector = Icons.Default.Person, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(16.dp)) },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = colors.inputInset,
                                        unfocusedContainerColor = colors.inputInset,
                                        focusedBorderColor = colors.primaryAction,
                                        unfocusedBorderColor = colors.border,
                                        focusedTextColor = colors.primaryText,
                                        unfocusedTextColor = colors.primaryText
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )

                                Spacer(modifier = Modifier.height(14.dp))

                                // Email Field
                                Text(
                                    text = "EMAIL ADDRESS",
                                    color = colors.mutedText,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 11.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = state.email,
                                    onValueChange = { viewModel.setEmail(it) },
                                    placeholder = { Text("name@example.com", color = colors.mutedText.copy(alpha = 0.5f), fontSize = 13.sp) },
                                    leadingIcon = { Icon(imageVector = Icons.Default.Email, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(16.dp)) },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = colors.inputInset,
                                        unfocusedContainerColor = colors.inputInset,
                                        focusedBorderColor = colors.primaryAction,
                                        unfocusedBorderColor = colors.border,
                                        focusedTextColor = colors.primaryText,
                                        unfocusedTextColor = colors.primaryText
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )

                                Spacer(modifier = Modifier.height(14.dp))

                                // Password Field
                                Text(
                                    text = "PASSWORD",
                                    color = colors.mutedText,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 11.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = state.password,
                                    onValueChange = { viewModel.setPassword(it) },
                                    placeholder = { Text("••••••••", color = colors.mutedText.copy(alpha = 0.5f), fontSize = 13.sp) },
                                    leadingIcon = { Icon(imageVector = Icons.Default.Lock, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(16.dp)) },
                                    trailingIcon = {
                                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                            Icon(
                                                imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                                contentDescription = "Toggle password",
                                                tint = colors.mutedText,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    },
                                    singleLine = true,
                                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = colors.inputInset,
                                        unfocusedContainerColor = colors.inputInset,
                                        focusedBorderColor = colors.primaryAction,
                                        unfocusedBorderColor = colors.border,
                                        focusedTextColor = colors.primaryText,
                                        unfocusedTextColor = colors.primaryText
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )

                                Spacer(modifier = Modifier.height(14.dp))

                                // Confirm Password Field
                                Text(
                                    text = "CONFIRM PASSWORD",
                                    color = colors.mutedText,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 11.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = state.confirmPassword,
                                    onValueChange = { viewModel.setConfirmPassword(it) },
                                    placeholder = { Text("••••••••", color = colors.mutedText.copy(alpha = 0.5f), fontSize = 13.sp) },
                                    leadingIcon = { Icon(imageVector = Icons.Default.Lock, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(16.dp)) },
                                    trailingIcon = {
                                        IconButton(onClick = { confirmPasswordVisible = !confirmPasswordVisible }) {
                                            Icon(
                                                imageVector = if (confirmPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                                contentDescription = "Toggle confirm password",
                                                tint = colors.mutedText,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    },
                                    singleLine = true,
                                    visualTransformation = if (confirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = colors.inputInset,
                                        unfocusedContainerColor = colors.inputInset,
                                        focusedBorderColor = colors.primaryAction,
                                        unfocusedBorderColor = colors.border,
                                        focusedTextColor = colors.primaryText,
                                        unfocusedTextColor = colors.primaryText
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )

                                Spacer(modifier = Modifier.height(18.dp))

                                // Register Submit Button
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (state.isLoading) colors.cardElevated else colors.primaryAction)
                                        .clickable(enabled = !state.isLoading) {
                                            viewModel.submit(onSuccess = onAuthSuccess)
                                        }
                                        .padding(vertical = 12.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (state.isLoading) {
                                        CircularProgressIndicator(
                                            color = colors.onPrimaryAction,
                                            modifier = Modifier.size(16.dp),
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = "Create Account",
                                                color = colors.onPrimaryAction,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.sp
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Icon(
                                                imageVector = Icons.Default.ArrowForward,
                                                contentDescription = null,
                                                tint = colors.onPrimaryAction,
                                                modifier = Modifier.size(14.dp)
                                            )
                                        }
                                    }
                                }
                            }

                            AuthTab.FORGOT -> {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(colors.cardElevated)
                                        .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                                        .align(Alignment.CenterHorizontally),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Refresh,
                                        contentDescription = null,
                                        tint = colors.primaryText,
                                        modifier = Modifier.size(22.dp)
                                    )
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                Text(
                                    text = "Password Recovery",
                                    color = colors.primaryText,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    modifier = Modifier.align(Alignment.CenterHorizontally)
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "We will email you a single-use recovery link valid for 1 hour.",
                                    color = colors.mutedText,
                                    fontSize = 11.sp,
                                    modifier = Modifier.align(Alignment.CenterHorizontally),
                                    textAlign = TextAlign.Center
                                )

                                Spacer(modifier = Modifier.height(16.dp))

                                Text(
                                    text = "REGISTERED EMAIL ADDRESS",
                                    color = colors.mutedText,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 11.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = state.email,
                                    onValueChange = { viewModel.setEmail(it) },
                                    placeholder = { Text("name@example.com", color = colors.mutedText.copy(alpha = 0.5f), fontSize = 13.sp) },
                                    leadingIcon = { Icon(imageVector = Icons.Default.Email, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(16.dp)) },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = colors.inputInset,
                                        unfocusedContainerColor = colors.inputInset,
                                        focusedBorderColor = colors.primaryAction,
                                        unfocusedBorderColor = colors.border,
                                        focusedTextColor = colors.primaryText,
                                        unfocusedTextColor = colors.primaryText
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )

                                Spacer(modifier = Modifier.height(18.dp))

                                // Send Recovery Link Button
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (state.isLoading) colors.cardElevated else colors.primaryAction)
                                        .clickable(enabled = !state.isLoading) {
                                            viewModel.requestPasswordReset()
                                        }
                                        .padding(vertical = 12.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (state.isLoading) {
                                        CircularProgressIndicator(
                                            color = colors.onPrimaryAction,
                                            modifier = Modifier.size(16.dp),
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = "Send Recovery Link",
                                                color = colors.onPrimaryAction,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.sp
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Icon(
                                                imageVector = Icons.Default.ArrowForward,
                                                contentDescription = null,
                                                tint = colors.onPrimaryAction,
                                                modifier = Modifier.size(14.dp)
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(14.dp))

                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { viewModel.setTab(AuthTab.SIGN_IN) }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "← Back to Sign In",
                                        color = colors.mutedText,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
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
