package com.webhunt.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import com.webhunt.app.data.storage.AppThemeMode

data class WebHuntThemeColors(
    val background: Color,
    val card: Color,
    val cardElevated: Color,
    val inputInset: Color,
    val primaryText: Color,
    val mutedText: Color,
    val border: Color,
    val borderSubtle: Color,
    val primaryAction: Color,
    val onPrimaryAction: Color,
    val emerald: Color = WebHuntEmerald,
    val emeraldTint: Color = WebHuntEmeraldTint,
    val red: Color = WebHuntRed,
    val redDark: Color = WebHuntRedDark,
    val gold: Color = WebHuntGold,
    val royal: Color = WebHuntRoyal,
    val royalHover: Color = WebHuntRoyalHover,
    val royalTint: Color = WebHuntRoyalTint,
    val blueBadge: Color = WebHuntBlueBadge,
    val isDark: Boolean = true
)

val DarkThemeTokens = WebHuntThemeColors(
    background = ArcadeObsidian,
    card = ArcadeDarkSurface,
    cardElevated = ArcadeElevated,
    inputInset = ArcadeInputInset,
    primaryText = ArcadePlatinum,
    mutedText = ArcadeMutedSilver,
    border = ArcadeBorderDark,
    borderSubtle = ArcadeBorderSubtleDark,
    primaryAction = ArcadePlatinum,
    onPrimaryAction = ArcadeObsidian,
    redDark = WebHuntRedDark,
    blueBadge = WebHuntBlueBadge,
    isDark = true
)

val LightThemeTokens = WebHuntThemeColors(
    background = ArcadeLightCanvas,
    card = ArcadeLightCard,
    cardElevated = ArcadeLightElevated,
    inputInset = ArcadeLightInput,
    primaryText = ArcadeDarkSlate,
    mutedText = ArcadeMutedSlate,
    border = ArcadeBorderLight,
    borderSubtle = ArcadeBorderSubtleLight,
    primaryAction = ArcadeDarkSlate,
    onPrimaryAction = Color.White,
    redDark = Color(0xFFFEE2E2),
    blueBadge = Color(0xFFE8EFFD),
    isDark = false
)

val LocalWebHuntColors = staticCompositionLocalOf { DarkThemeTokens }

private val WebHuntDarkColorScheme = darkColorScheme(
    primary = ArcadePlatinum,
    onPrimary = ArcadeObsidian,
    primaryContainer = ArcadeElevated,
    onPrimaryContainer = ArcadePlatinum,
    secondary = WebHuntEmerald,
    onSecondary = ArcadePlatinum,
    background = ArcadeObsidian,
    onBackground = ArcadePlatinum,
    surface = ArcadeDarkSurface,
    onSurface = ArcadePlatinum,
    surfaceVariant = ArcadeInputInset,
    onSurfaceVariant = ArcadeMutedSilver,
    outline = ArcadeBorderDark,
    error = WebHuntRed,
    onError = ArcadePlatinum
)

private val WebHuntLightColorScheme = lightColorScheme(
    primary = ArcadeDarkSlate,
    onPrimary = ArcadeLightCard,
    primaryContainer = ArcadeLightElevated,
    onPrimaryContainer = ArcadeDarkSlate,
    secondary = WebHuntEmerald,
    onSecondary = ArcadeLightCard,
    background = ArcadeLightCanvas,
    onBackground = ArcadeDarkSlate,
    surface = ArcadeLightCard,
    onSurface = ArcadeDarkSlate,
    surfaceVariant = ArcadeLightInput,
    onSurfaceVariant = ArcadeMutedSlate,
    outline = ArcadeBorderLight,
    error = WebHuntRed,
    onError = ArcadeLightCard
)

object WebHuntTheme {
    val colors: WebHuntThemeColors
        @Composable
        @ReadOnlyComposable
        get() = LocalWebHuntColors.current
}

@Composable
fun WebHuntTheme(
    themeMode: AppThemeMode = AppThemeMode.DARK,
    content: @Composable () -> Unit
) {
    val isSystemDark = isSystemInDarkTheme()
    val isDark = when (themeMode) {
        AppThemeMode.DARK -> true
        AppThemeMode.LIGHT -> false
        AppThemeMode.SYSTEM -> isSystemDark
    }

    val customColors = if (isDark) DarkThemeTokens else LightThemeTokens
    val materialColors = if (isDark) WebHuntDarkColorScheme else WebHuntLightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = customColors.background.toArgb()
            window.navigationBarColor = customColors.background.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !isDark
                isAppearanceLightNavigationBars = !isDark
            }
        }
    }

    CompositionLocalProvider(LocalWebHuntColors provides customColors) {
        MaterialTheme(
            colorScheme = materialColors,
            typography = WebHuntTypography,
            shapes = WebHuntShapes,
            content = content
        )
    }
}
