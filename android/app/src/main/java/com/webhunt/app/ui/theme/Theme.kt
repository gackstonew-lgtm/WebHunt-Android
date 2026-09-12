package com.webhunt.app.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val WebHuntColorScheme = darkColorScheme(
    primary = WebHuntRoyal,
    onPrimary = WebHuntPaper,
    primaryContainer = WebHuntHover,
    onPrimaryContainer = WebHuntPaper,
    secondary = WebHuntEmerald,
    onSecondary = WebHuntPaper,
    background = WebHuntBlack,
    onBackground = WebHuntPaper,
    surface = WebHuntCard,
    onSurface = WebHuntPaper,
    surfaceVariant = WebHuntSurface,
    onSurfaceVariant = WebHuntMuted,
    outline = WebHuntBorder,
    error = WebHuntRed,
    onError = WebHuntPaper
)

@Composable
fun WebHuntTheme(
    content: @Composable () -> Unit
) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = WebHuntBlack.toArgb()
            window.navigationBarColor = WebHuntBlack.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = false
                isAppearanceLightNavigationBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = WebHuntColorScheme,
        typography = WebHuntTypography,
        shapes = WebHuntShapes,
        content = content
    )
}
