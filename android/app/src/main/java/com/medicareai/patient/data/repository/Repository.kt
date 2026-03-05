package com.medicareai.patient.data.repository

import com.medicareai.patient.data.api.MediCareApiClient
import com.medicareai.patient.data.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiClient: MediCareApiClient
) {
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return apiClient.login(LoginRequest(email, password))
    }
    
    suspend fun register(
        email: String,
        password: String,
        fullName: String,
        dateOfBirth: String? = null,
        gender: String? = null,
        phone: String? = null,
        address: String? = null,
        emergencyContactName: String? = null,
        emergencyContactPhone: String? = null
    ): Result<RegisterResponse> {
        return apiClient.register(
            RegisterRequest(
                email = email,
                password = password,
                full_name = fullName,
                date_of_birth = dateOfBirth,
                gender = gender,
                phone = phone,
                address = address,
                emergency_contact_name = emergencyContactName,
                emergency_contact_phone = emergencyContactPhone
            )
        )
    }
    
    suspend fun logout(): Result<Unit> {
        return apiClient.logout()
    }
    
    suspend fun getCurrentUser(): Result<User> {
        return apiClient.getCurrentUser()
    }
    
    suspend fun updateCurrentUser(updates: Map<String, String?>): Result<User> {
        return apiClient.updateCurrentUser(updates)
    }
    
    suspend fun refreshToken(refreshToken: String): Result<Token> {
        return apiClient.refreshToken(refreshToken)
    }
    
    suspend fun getVerificationStatus(): Result<VerificationStatus> {
        return apiClient.getVerificationStatus()
    }
    
    suspend fun sendVerificationEmail(): Result<Unit> {
        return apiClient.sendVerificationEmail()
    }
    
    fun setAuthToken(token: String?) {
        apiClient.setAuthToken(token)
    }
}

@Singleton
class PatientRepository @Inject constructor(
    private val apiClient: MediCareApiClient
) {
    suspend fun getMyProfile(): Result<Patient> {
        return apiClient.getMyPatientProfile()
    }
    
    suspend fun updateMyProfile(update: PatientUpdateRequest): Result<Patient> {
        return apiClient.updateMyPatientProfile(update)
    }
}

@Singleton
class MedicalCaseRepository @Inject constructor(
    private val apiClient: MediCareApiClient
) {
    suspend fun getCases(): Result<List<MedicalCase>> {
        return apiClient.getMedicalCases()
    }
    
    suspend fun getCase(caseId: String): Result<MedicalCase> {
        return apiClient.getMedicalCase(caseId)
    }
    
    suspend fun createCase(
        title: String,
        symptoms: String,
        severity: String? = null,
        description: String? = null
    ): Result<MedicalCase> {
        return apiClient.createMedicalCase(
            CreateCaseRequest(title, symptoms, severity, description)
        )
    }
    
    suspend fun getDoctorComments(caseId: String): Result<List<DoctorComment>> {
        return apiClient.getDoctorComments(caseId)
    }
    
    suspend fun replyToComment(caseId: String, commentId: String, content: String): Result<Unit> {
        return apiClient.replyToDoctorComment(caseId, commentId, CreateReplyRequest(content))
    }
}

@Singleton
class AIDiagnosisRepository @Inject constructor(
    private val apiClient: MediCareApiClient
) {
    suspend fun diagnose(request: DiagnosisRequest): Result<AIFeedback> {
        return apiClient.diagnose(request)
    }
}