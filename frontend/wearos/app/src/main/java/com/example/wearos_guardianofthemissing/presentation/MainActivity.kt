package com.example.wearos_guardianofthemissing.presentation

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.SignalWifiOff
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material3.*
import com.example.wearos_guardianofthemissing.presentation.theme.WEAROS_GuardianOfTheMissingTheme

class MainActivity : ComponentActivity() {

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* No hace falta manejar el resultado */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        crearCanalNotificacion()
        pedirPermisoNotificaciones()

        setContent {
            WEAROS_GuardianOfTheMissingTheme {
                AppScaffold {
                    val viewModel: PanicoViewModel = viewModel()
                    WearApp(viewModel)
                }
            }
        }
    }

    private fun pedirPermisoNotificaciones() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ActivityCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun crearCanalNotificacion() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val canal = NotificationChannel(
                CANAL_ID,
                "Alertas principales",
                NotificationManager.IMPORTANCE_HIGH
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(canal)
        }
    }

    companion object {
        private const val CANAL_ID = "canal_principal"
    }
}

@Composable
fun WearApp(viewModel: PanicoViewModel) {
    val uiState = viewModel.uiState
    val haptic = LocalHapticFeedback.current

    ScreenScaffold(
        timeText = { TimeText() }
    ) { contentPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(contentPadding),
            contentAlignment = Alignment.Center
        ) {
            when (uiState) {
                is PanicoUiState.Idle -> {
                    BotonPanicoPrincipal(onClick = { viewModel.enviarAlerta() })
                }
                is PanicoUiState.Loading -> {
                    EstadoCarga()
                }
                is PanicoUiState.Success -> {
                    LaunchedEffect(Unit) {
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                    }
                    EstadoExito(onReset = { viewModel.resetState() })
                }
                is PanicoUiState.Error -> {
                    EstadoError(
                        mensaje = uiState.message,
                        onRetry = { viewModel.enviarAlerta() }
                    )
                }
            }

            // Icono de conectividad persistente
            IconoConectividad(modifier = Modifier.align(Alignment.TopCenter))
        }
    }
}

@Composable
fun BotonPanicoPrincipal(onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .size(120.dp) // Tamaño destacado circular
            .background(Color.Transparent, CircleShape),
        shape = CircleShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.error,
            contentColor = MaterialTheme.colorScheme.onError
        )
    ) {
        Text(
            text = "PÁNICO",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Black,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun EstadoCarga() {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        CircularProgressIndicator(
            modifier = Modifier.size(80.dp)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Enviando alerta...",
            style = MaterialTheme.typography.labelMedium,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun EstadoExito(onReset: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(16.dp)
    ) {
        Icon(
            imageVector = Icons.Default.Check,
            contentDescription = "Éxito",
            tint = Color.Green,
            modifier = Modifier.size(48.dp)
        )
        Text(
            text = "¡Alerta Enviada!",
            style = MaterialTheme.typography.titleSmall,
            color = Color.Green,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Button(
            onClick = onReset,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.filledTonalButtonColors()
        ) {
            Text("Entendido")
        }
    }
}

@Composable
fun EstadoError(mensaje: String, onRetry: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(16.dp)
    ) {
        Icon(
            imageVector = Icons.Default.Error,
            contentDescription = "Error",
            tint = MaterialTheme.colorScheme.error,
            modifier = Modifier.size(40.dp)
        )
        Text(
            text = mensaje,
            style = MaterialTheme.typography.labelSmall,
            textAlign = TextAlign.Center,
            maxLines = 2
        )
        Spacer(modifier = Modifier.height(8.dp))
        Button(
            onClick = onRetry,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Reintentar")
        }
    }
}

@Composable
fun IconoConectividad(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val esRedonda = LocalConfiguration.current.isScreenRound

    var conectado by remember { mutableStateOf(true) }

    DisposableEffect(Unit) {
        val connectivityManager = context.getSystemService(ConnectivityManager::class.java)
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) { conectado = true }
            override fun onLost(network: Network) { conectado = false }
        }
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(request, callback)
        onDispose { connectivityManager.unregisterNetworkCallback(callback) }
    }

    val paddingSuperior = if (esRedonda) 28.dp else 8.dp

    Box(
        modifier = modifier
            .padding(top = paddingSuperior)
            .size(24.dp)
            .background(
                color = MaterialTheme.colorScheme.surfaceContainer.copy(alpha = 0.5f),
                shape = CircleShape
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = if (conectado) Icons.Default.Wifi else Icons.Default.SignalWifiOff,
            contentDescription = if (conectado) "Conectado" else "Sin conexión",
            tint = if (conectado) Color.Green else Color.Gray,
            modifier = Modifier.size(14.dp)
        )
    }
}
