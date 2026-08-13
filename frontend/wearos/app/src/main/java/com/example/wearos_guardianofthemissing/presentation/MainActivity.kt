package com.example.wearos_guardianofthemissing.presentation

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.pm.PackageManager
import android.content.res.Configuration
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
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SignalWifiOff
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.Icon
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text

class MainActivity : ComponentActivity() {

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* No necesitamos hacer nada especial con el resultado por ahora */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        crearCanalNotificacion()
        pedirPermisoNotificaciones()

        setContent {
            WearApp(onBotonPrincipalPresionado = { manejarClicBotonPrincipal() })
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

    private fun manejarClicBotonPrincipal() {
        // TODO: Aquí añadirás la lógica real más adelante (ej. enviar alerta, guardar evento, etc.)

        mostrarNotificacion()
    }

    private fun mostrarNotificacion() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ActivityCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                return
            }
        }

        val notificacion = NotificationCompat.Builder(this, CANAL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("Alerta activada")
            .setContentText("Se presionó el botón principal.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, notificacion)
    }

    companion object {
        private const val CANAL_ID = "canal_principal"
        private const val NOTIFICATION_ID = 1
    }
}

@Composable
fun WearApp(onBotonPrincipalPresionado: () -> Unit) {
    MaterialTheme {
        Box(modifier = Modifier.fillMaxSize()) {

            // Botón rojo que abarca casi toda la pantalla, con un borde corto alrededor
            Button(
                onClick = onBotonPrincipalPresionado,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp)
                    .align(Alignment.Center),
                colors = ButtonDefaults.buttonColors(backgroundColor = Color(0xff9f0712))
            ) {
                // Contenido centrado: título + texto descriptivo
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "Botón de pánico",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "Presiona para enviar una alerta",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            // Ícono de conectividad en la esquina, responsivo a pantalla redonda
            IconoConectividad(modifier = Modifier.align(Alignment.TopCenter))
        }
    }
}

@Composable
fun IconoConectividad(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val esRedonda = LocalConfiguration.current.isScreenRound

    var conectado by remember { mutableStateOf(true) }

    DisposableEffect(Unit) {
        val connectivityManager =
            context.getSystemService(ConnectivityManager::class.java)

        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                conectado = true
            }

            override fun onLost(network: Network) {
                conectado = false
            }
        }

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        connectivityManager.registerNetworkCallback(request, callback)

        onDispose {
            connectivityManager.unregisterNetworkCallback(callback)
        }
    }

    // En pantallas redondas el contenido de las esquinas se recorta,
    // por eso usamos más padding superior para que el ícono quede visible
    val paddingSuperior = if (esRedonda) 18.dp else 8.dp

    Box(
        modifier = modifier
            .padding(top = paddingSuperior)
            .size(28.dp)
            .background(color = Color.Black.copy(alpha = 0.35f), shape = CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = if (conectado) Icons.Default.Wifi else Icons.Default.SignalWifiOff,
            contentDescription = if (conectado) "Conectado" else "Sin conexión",
            tint = if (conectado) Color.Green else Color.Gray,
            modifier = Modifier.size(16.dp)
        )
    }
}