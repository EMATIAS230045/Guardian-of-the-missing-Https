package com.example.wearos_guardianofthemissing.presentation

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.wearos_guardianofthemissing.data.network.PanicoRequest
import com.example.wearos_guardianofthemissing.data.network.PanicoResponse
import com.example.wearos_guardianofthemissing.data.network.RetrofitClient
import kotlinx.coroutines.launch
import java.net.SocketTimeoutException

sealed interface PanicoUiState {
    object Idle : PanicoUiState
    object Loading : PanicoUiState
    data class Success(val response: PanicoResponse) : PanicoUiState
    data class Error(val message: String) : PanicoUiState
}

class PanicoViewModel : ViewModel() {

    var uiState: PanicoUiState by mutableStateOf(PanicoUiState.Idle)
        private set

    fun enviarAlerta() {
        uiState = PanicoUiState.Loading

        viewModelScope.launch {
            try {
                // Datos de prueba según especificación
                val request = PanicoRequest(
                    id_usuario = 2,
                    id_dispositivo = 2,
                    latitud = 34.5555,
                    longitud = 54.3333,
                    id_geocerca_mongo = "Geo-01"
                )

                val response = RetrofitClient.apiService.enviarAlertaPanico(request)
                uiState = PanicoUiState.Success(response)
            } catch (e: SocketTimeoutException) {
                uiState = PanicoUiState.Error("Tiempo agotado. Intenta de nuevo.")
            } catch (e: Exception) {
                uiState = PanicoUiState.Error("Error de red: ${e.localizedMessage}")
            }
        }
    }

    fun resetState() {
        uiState = PanicoUiState.Idle
    }
}
