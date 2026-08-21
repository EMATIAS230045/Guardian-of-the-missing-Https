package com.example.wearos_guardianofthemissing.data.network

import com.google.gson.annotations.SerializedName
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

data class PanicoRequest(
    val id_usuario: Int,
    val id_dispositivo: Int,
    val latitud: Double,
    val longitud: Double,
    val id_geocerca_mongo: String
)

data class PanicoResponse(
    @SerializedName("id_alerta") val idAlerta: Int?,
    val estado: String?,
    val riesgo: String?,
    @SerializedName("fecha_hora") val fechaHora: String?
)

interface ApiService {
    @POST("alertas/panico")
    suspend fun enviarAlertaPanico(@Body request: PanicoRequest): PanicoResponse
}

object RetrofitClient {
    private const val BASE_URL = "https://guardian-api-mmxu.onrender.com/"

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val httpClient = OkHttpClient.Builder()
        .addInterceptor(logging)
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    val apiService: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(httpClient)
            .build()
            .create(ApiService::class.java)
    }
}
