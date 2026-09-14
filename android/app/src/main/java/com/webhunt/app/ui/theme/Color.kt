package com.webhunt.app.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color

// ==========================================
// ARCADE FX INSTITUTIONAL DESIGN TOKENS
// Source of Truth: https://web-hunt-delta.vercel.app/
// ==========================================

// --- Dark Theme Tokens (Default) ---
val ArcadeObsidian = Color(0xFF08090B)       // Canvas / Background
val ArcadeDarkSurface = Color(0xFF111214)     // Primary Card Surface
val ArcadeElevated = Color(0xFF18191D)        // Inner Elevated Surface & Chips
val ArcadeInputInset = Color(0xFF0D0E11)      // Input Background
val ArcadePlatinum = Color(0xFFEEEEEE)        // High-Contrast Primary Text & Action
val ArcadeMutedSilver = Color(0xFF989BA3)     // Muted Secondary Text
val ArcadeBorderDark = Color(0x14FFFFFF)      // Hairline Border (rgba(255, 255, 255, 0.08))
val ArcadeBorderSubtleDark = Color(0x0DFFFFFF)// Subtle Border (rgba(255, 255, 255, 0.05))
val ArcadeBorderStrongDark = Color(0x29FFFFFF)// Strong Border (rgba(255, 255, 255, 0.16))

// --- Light Theme Tokens ---
val ArcadeLightCanvas = Color(0xFFF5F5F7)     // Light Canvas Background
val ArcadeLightCard = Color(0xFFFFFFFF)       // Crisp Light Card Surface
val ArcadeLightElevated = Color(0xFFF0F0F3)   // Light Elevated Surface
val ArcadeLightInput = Color(0xFFF8F9FA)      // Light Input Background
val ArcadeDarkSlate = Color(0xFF0F172A)       // High-Contrast Dark Slate Text & Action
val ArcadeMutedSlate = Color(0xFF64748B)      // Neutral Slate Secondary Text
val ArcadeBorderLight = Color(0x14000000)     // Hairline Light Border (rgba(0, 0, 0, 0.08))
val ArcadeBorderSubtleLight = Color(0x0D000000) // Subtle Light Border (rgba(0, 0, 0, 0.05))
val ArcadeBorderStrongLight = Color(0x29000000) // Strong Light Border (rgba(0, 0, 0, 0.16))

// --- Semantic Accents ---
val WebHuntEmerald = Color(0xFF10B981)        // Verified status & phone
val WebHuntEmeraldTint = Color(0x2610B981)    // Emerald with 15% alpha
val WebHuntRed = Color(0xFFEF4444)            // Destructive & error text
val WebHuntRedDark = Color(0xFF261010)        // Error notice background
val WebHuntGold = Color(0xFFFBBF24)           // Star ratings & accolades
val WebHuntRoyal = Color(0xFF0048BB)          // Brand accent
val WebHuntRoyalHover = Color(0xFF00388A)
val WebHuntRoyalTint = Color(0x330048BB)
val WebHuntBlueBadge = Color(0xFF10192A)

// --- Dynamic Theme Aliases (Reflecting Current Active Theme Dynamically) ---
val WebHuntBlack: Color
    @Composable
    @ReadOnlyComposable
    get() = WebHuntTheme.colors.background

val WebHuntCard: Color
    @Composable
    @ReadOnlyComposable
    get() = WebHuntTheme.colors.card

val WebHuntSurface: Color
    @Composable
    @ReadOnlyComposable
    get() = WebHuntTheme.colors.inputInset

val WebHuntHover: Color
    @Composable
    @ReadOnlyComposable
    get() = WebHuntTheme.colors.cardElevated

val WebHuntBorder: Color
    @Composable
    @ReadOnlyComposable
    get() = WebHuntTheme.colors.border

val WebHuntBorderSubtle: Color
    @Composable
    @ReadOnlyComposable
    get() = WebHuntTheme.colors.borderSubtle

val WebHuntPaper: Color
    @Composable
    @ReadOnlyComposable
    get() = WebHuntTheme.colors.primaryText

val WebHuntMuted: Color
    @Composable
    @ReadOnlyComposable
    get() = WebHuntTheme.colors.mutedText
