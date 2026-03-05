package com.medicareai.patient.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medicareai.patient.data.model.*
import com.medicareai.patient.data.repository.AuthRepository
import com.medicareai.patient.data.repository.MedicalCaseRepository
import com.medicareai.patient.data.repository.PatientRepository
import com.medicareai.patient.data.repository.AIDiagnosisRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
    object Idle : UiState<Nothing>()
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _loginState = MutableStateFlow<UiState<LoginResponse>>(UiState.Idle)
    val loginState: StateFlow<UiState<LoginResponse>> = _loginState.asStateFlow()
    
    private val _registerState = MutableStateFlow<UiState<RegisterResponse>>(UiState.Idle)
    val registerState: StateFlow<UiState<RegisterResponse>> = _registerState.asStateFlow()
    
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()
    
    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()
    
    fun login(email: String, password: String) {
        viewModelScope.launch {
            _loginState.value = UiState.Loading
            authRepository.login(email, password)
                .onSuccess { response ->
                    authRepository.setAuthToken(response.tokens.access_token)
                    _currentUser.value = response.user
                    _isLoggedIn.value = true
                    _loginState.value = UiState.Success(response)
                }
                .onFailure { error ->
                    _loginState.value = UiState.Error(error.message ?: "登录失败")
                }
        }
    }
    
    fun register(
        email: String,
        password: String,
        fullName: String,
        dateOfBirth: String? = null,
        gender: String? = null,
        phone: String? = null,
        address: String? = null,
        emergencyContactName: String? = null,
        emergencyContactPhone: String? = null
    ) {
        viewModelScope.launch {
            _registerState.value = UiState.Loading
            authRepository.register(
                email, password, fullName, dateOfBirth, gender,
                phone, address, emergencyContactName, emergencyContactPhone
            )
                .onSuccess { response ->
                    _registerState.value = UiState.Success(response)
                }
                .onFailure { error ->
                    _registerState.value = UiState.Error(error.message ?: "注册失败")
                }
        }
    }
    
    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            authRepository.setAuthToken(null)
            _currentUser.value = null
            _isLoggedIn.value = false
            _loginState.value = UiState.Idle
        }
    }
    
    fun checkAuthStatus() {
        viewModelScope.launch {
            authRepository.getCurrentUser()
                .onSuccess { user ->
                    _currentUser.value = user
                    _isLoggedIn.value = true
                }
                .onFailure {
                    _isLoggedIn.value = false
                }
        }
    }
    
    fun clearLoginState() {
        _loginState.value = UiState.Idle
    }
    
    fun clearRegisterState() {
        _registerState.value = UiState.Idle
    }
}

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val patientRepository: PatientRepository
) : ViewModel() {
    
    private val _profileState = MutableStateFlow<UiState<Patient>>(UiState.Idle)
    val profileState: StateFlow<UiState<Patient>> = _profileState.asStateFlow()
    
    private val _updateState = MutableStateFlow<UiState<Patient>>(UiState.Idle)
    val updateState: StateFlow<UiState<Patient>> = _updateState.asStateFlow()
    
    fun loadProfile() {
        viewModelScope.launch {
            _profileState.value = UiState.Loading
            patientRepository.getMyProfile()
                .onSuccess { patient ->
                    _profileState.value = UiState.Success(patient)
                }
                .onFailure { error ->
                    _profileState.value = UiState.Error(error.message ?: "加载失败")
                }
        }
    }
    
    fun updateProfile(update: PatientUpdateRequest) {
        viewModelScope.launch {
            _updateState.value = UiState.Loading
            patientRepository.updateMyProfile(update)
                .onSuccess { patient ->
                    _updateState.value = UiState.Success(patient)
                    _profileState.value = UiState.Success(patient)
                }
                .onFailure { error ->
                    _updateState.value = UiState.Error(error.message ?: "更新失败")
                }
        }
    }
    
    fun clearUpdateState() {
        _updateState.value = UiState.Idle
    }
}

@HiltViewModel
class MedicalRecordsViewModel @Inject constructor(
    private val caseRepository: MedicalCaseRepository
) : ViewModel() {
    
    private val _casesState = MutableStateFlow<UiState<List<MedicalCase>>>(UiState.Idle)
    val casesState: StateFlow<UiState<List<MedicalCase>>> = _casesState.asStateFlow()
    
    private val _caseDetailState = MutableStateFlow<UiState<MedicalCase>>(UiState.Idle)
    val caseDetailState: StateFlow<UiState<MedicalCase>> = _caseDetailState.asStateFlow()
    
    private val _commentsState = MutableStateFlow<UiState<List<DoctorComment>>>(UiState.Idle)
    val commentsState: StateFlow<UiState<List<DoctorComment>>> = _commentsState.asStateFlow()
    
    fun loadCases() {
        viewModelScope.launch {
            _casesState.value = UiState.Loading
            caseRepository.getCases()
                .onSuccess { cases ->
                    _casesState.value = UiState.Success(cases)
                }
                .onFailure { error ->
                    _casesState.value = UiState.Error(error.message ?: "加载失败")
                }
        }
    }
    
    fun loadCaseDetail(caseId: String) {
        viewModelScope.launch {
            _caseDetailState.value = UiState.Loading
            caseRepository.getCase(caseId)
                .onSuccess { case ->
                    _caseDetailState.value = UiState.Success(case)
                }
                .onFailure { error ->
                    _caseDetailState.value = UiState.Error(error.message ?: "加载失败")
                }
        }
    }
    
    fun loadComments(caseId: String) {
        viewModelScope.launch {
            _commentsState.value = UiState.Loading
            caseRepository.getDoctorComments(caseId)
                .onSuccess { comments ->
                    _commentsState.value = UiState.Success(comments)
                }
                .onFailure { error ->
                    _commentsState.value = UiState.Error(error.message ?: "加载失败")
                }
        }
    }
    
    fun replyToComment(caseId: String, commentId: String, content: String) {
        viewModelScope.launch {
            caseRepository.replyToComment(caseId, commentId, content)
                .onSuccess {
                    loadComments(caseId)
                }
        }
    }
}

@HiltViewModel
class SymptomSubmitViewModel @Inject constructor(
    private val caseRepository: MedicalCaseRepository,
    private val aiRepository: AIDiagnosisRepository
) : ViewModel() {
    
    private val _submitState = MutableStateFlow<UiState<MedicalCase>>(UiState.Idle)
    val submitState: StateFlow<UiState<MedicalCase>> = _submitState.asStateFlow()
    
    private val _diagnosisState = MutableStateFlow<UiState<AIFeedback>>(UiState.Idle)
    val diagnosisState: StateFlow<UiState<AIFeedback>> = _diagnosisState.asStateFlow()
    
    fun submitSymptoms(
        title: String,
        symptoms: String,
        severity: String? = null,
        description: String? = null
    ) {
        viewModelScope.launch {
            _submitState.value = UiState.Loading
            caseRepository.createCase(title, symptoms, severity, description)
                .onSuccess { case ->
                    _submitState.value = UiState.Success(case)
                    // Start AI diagnosis
                    diagnose(case.id, symptoms, severity)
                }
                .onFailure { error ->
                    _submitState.value = UiState.Error(error.message ?: "提交失败")
                }
        }
    }
    
    private fun diagnose(caseId: String, symptoms: String, severity: String?) {
        viewModelScope.launch {
            _diagnosisState.value = UiState.Loading
            aiRepository.diagnose(
                DiagnosisRequest(
                    symptoms = symptoms,
                    symptom_severity = severity,
                    case_id = caseId,
                    language = "zh"
                )
            )
                .onSuccess { feedback ->
                    _diagnosisState.value = UiState.Success(feedback)
                }
                .onFailure { error ->
                    _diagnosisState.value = UiState.Error(error.message ?: "诊断失败")
                }
        }
    }
    
    fun clearStates() {
        _submitState.value = UiState.Idle
        _diagnosisState.value = UiState.Idle
    }
}