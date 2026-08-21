package com.example.wearos_guardianofthemissing.presentation.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material3.ColorScheme
import androidx.wear.compose.material3.MaterialTheme

// Color de emergencia personalizado (Rojo intenso con alta visibilidad)
val EmergencyRed = Color(0xFF9F0712)
val OnEmergencyRed = Color.White

private val wearColorScheme = ColorScheme(
    primary = Color(0xFFE2E2E2),
    onPrimary = Color.Black,
    secondary = Color(0xFFC0C0C0),
    onSecondary = Color.Black,
    error = EmergencyRed,
    onError = OnEmergencyRed,
    errorDim = EmergencyRed, // Usado para alertas de seguridad según guía Wear M3
    background = Color.Black,
    onBackground = Color.White,
    surfaceContainer = Color(0xFF1C1C1C),
    onSurface = Color.White,
)

@Composable
fun WEAROS_GuardianOfTheMissingTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = wearColorScheme,
        content = content
    )
}
