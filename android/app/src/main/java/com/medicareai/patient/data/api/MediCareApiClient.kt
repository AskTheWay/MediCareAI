package com.medicareai.patient.data.api

import com.medicareai.patient.data.model.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import okhttp3.logging.HttpLoggingInterceptor
import java.security.SecureRandom
import java.security.cert.X509Certificate
import java.util.concurrent.TimeUnit
import javax.net.ssl.*
import android.util.Log

class MediCareApiClient {
    
    companion object {
        // Using IP address with HTTPS - certificate verification disabled for development
        const val BASE_URL = "https://8.137.177.147/api/v1/"
        const val TAG = "MediCareApiClient"
    }
    
    private var authToken: String? = null
    
    // Create all-trusting trust manager for development
    private fun createUnsafeTrustManager(): X509TrustManager {
        return object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {
                Log.d(TAG, "checkClientTrusted: $authType")
            }
            override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {
                Log.d(TAG, "checkServerTrusted: $authType, certs: ${chain?.size}")
            }
            override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
        }
    }
    
    // Create unsafe hostname verifier
    private fun createUnsafeHostnameVerifier(): HostnameVerifier {
        return HostnameVerifier { hostname, session ->
            Log.d(TAG, "Verifying hostname: $hostname, peerHost: ${session?.peerHost}")
            true
        }
    }
    
    // Create SSL context that trusts all certificates
    private fun createUnsafeSSLContext(): SSLContext {
        val trustAllCerts = arrayOf<TrustManager>(createUnsafeTrustManager())
        return SSLContext.getInstance("SSL").apply {
            init(null, trustAllCerts, SecureRandom())
        }
    }
    
    val client = HttpClient(OkHttp) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
                encodeDefaults = true
            })
        }
        
        install(Logging) {
            level = LogLevel.ALL
            logger = object : Logger {
                override fun log(message: String) {
                    Log.d(TAG, message)
                }
            }
        }
        
        install(DefaultRequest) {
            header(HttpHeaders.ContentType, ContentType.Application.Json)
            header("X-Platform", "patient")
        }
        
        install(HttpTimeout) {
            requestTimeoutMillis = 30000
            connectTimeoutMillis = 30000
            socketTimeoutMillis = 30000
        }
        
        // Configure OkHttp engine for Android 16 compatibility
        engine {
            config {
                // Disable SSL verification for development
                val sslContext = createUnsafeSSLContext()
                sslSocketFactory(sslContext.socketFactory, createUnsafeTrustManager())
                hostnameVerifier(createUnsafeHostnameVerifier())
                
                // Connection settings
                connectTimeout(30, TimeUnit.SECONDS)
                readTimeout(30, TimeUnit.SECONDS)
                writeTimeout(30, TimeUnit.SECONDS)
                
                // Retry on connection failure
                retryOnConnectionFailure(true)
                
                // Follow redirects
                followRedirects(true)
                followSslRedirects(true)
                
                // Connection pool
                connectionPool(okhttp3.ConnectionPool(10, 5, TimeUnit.MINUTES))
                
                // Protocols - support TLS 1.2 and 1.3
                protocols(listOf(okhttp3.Protocol.HTTP_2, okhttp3.Protocol.HTTP_1_1))
                
                // Logging
                addInterceptor(HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BODY
                })
            }
        }
        
        followRedirects = true
        expectSuccess = false
    }
    
    fun setAuthToken(token: String?) {
        authToken = token
    }
    
    private suspend inline fun <reified T> makeRequest(
        method: HttpMethod,
        endpoint: String,
        body: Any? = null,
        queryParams: Map<String, String>? = null
    ): Result<T> {
        return try {
            Log.d(TAG, "Making $method request to: $BASE_URL$endpoint")
            
            val response = client.request(BASE_URL + endpoint) {
                this.method = method
                authToken?.let {
                    header(HttpHeaders.Authorization, "Bearer $it")
                }
                body?.let {
                    setBody(it)
                }
                queryParams?.forEach { (key, value) ->
                    parameter(key, value)
                }
            }
            
            Log.d(TAG, "Response status: ${response.status}")
            
            if (response.status.isSuccess()) {
                Result.success(response.body())
            } else {
                val errorBody = try {
                    response.body<ApiResponse<String>>()
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing error body", e)
                    null
                }
                Result.failure(
                    ApiException(
                        response.status.value,
                        errorBody?.detail ?: errorBody?.message ?: "Unknown error (HTTP ${response.status.value})"
                    )
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Request failed: ${e.message}", e)
            Result.failure(e)
        }
    }
    
    // Auth APIs
    suspend fun login(request: LoginRequest): Result<LoginResponse> = 
        makeRequest(HttpMethod.Post, "auth/login", request)
    
    suspend fun register(request: RegisterRequest): Result<RegisterResponse> = 
        makeRequest(HttpMethod.Post, "auth/register", request)
    
    suspend fun logout(): Result<Unit> = 
        makeRequest(HttpMethod.Post, "auth/logout")
    
    suspend fun getCurrentUser(): Result<User> = 
        makeRequest(HttpMethod.Get, "auth/me")
    
    suspend fun updateCurrentUser(userUpdate: Map<String, String?>): Result<User> = 
        makeRequest(HttpMethod.Put, "auth/me", userUpdate)
    
    suspend fun refreshToken(refreshToken: String): Result<Token> = 
        makeRequest(HttpMethod.Post, "auth/refresh", mapOf("refresh_token" to refreshToken))
    
    suspend fun getVerificationStatus(): Result<VerificationStatus> = 
        makeRequest(HttpMethod.Get, "auth/verification-status")
    
    suspend fun sendVerificationEmail(): Result<Unit> = 
        makeRequest(HttpMethod.Post, "auth/send-verification-email")
    
    suspend fun verifyEmail(token: String): Result<Unit> = 
        makeRequest(HttpMethod.Get, "auth/verify-email?token=$token")
    
    // Patient APIs
    suspend fun getMyPatientProfile(): Result<Patient> = 
        makeRequest(HttpMethod.Get, "patients/me")
    
    suspend fun updateMyPatientProfile(update: PatientUpdateRequest): Result<Patient> = 
        makeRequest(HttpMethod.Put, "patients/me", update)
    
    // Medical Case APIs
    suspend fun getMedicalCases(): Result<List<MedicalCase>> = 
        makeRequest(HttpMethod.Get, "medical-cases")
    
    suspend fun getMedicalCase(caseId: String): Result<MedicalCase> = 
        makeRequest(HttpMethod.Get, "medical-cases/$caseId")
    
    suspend fun createMedicalCase(request: CreateCaseRequest): Result<MedicalCase> = 
        makeRequest(HttpMethod.Post, "medical-cases", request)
    
    suspend fun getDoctorComments(caseId: String): Result<List<DoctorComment>> = 
        makeRequest(HttpMethod.Get, "medical-cases/$caseId/doctor-comments")
    
    suspend fun replyToDoctorComment(caseId: String, commentId: String, request: CreateReplyRequest): Result<Unit> = 
        makeRequest(
            HttpMethod.Post, 
            "medical-cases/$caseId/doctor-comments/$commentId/reply", 
            request
        )
    
    // AI Diagnosis APIs
    suspend fun diagnose(request: DiagnosisRequest): Result<AIFeedback> = 
        makeRequest(HttpMethod.Post, "ai/comprehensive-diagnosis", request)
}

class ApiException(val code: Int, message: String) : Exception(message)