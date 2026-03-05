package com.medicareai.patient.di

import com.medicareai.patient.data.api.MediCareApiClient
import com.medicareai.patient.data.repository.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    
    @Provides
    @Singleton
    fun provideApiClient(): MediCareApiClient {
        return MediCareApiClient()
    }
    
    @Provides
    @Singleton
    fun provideAuthRepository(apiClient: MediCareApiClient): AuthRepository {
        return AuthRepository(apiClient)
    }
    
    @Provides
    @Singleton
    fun providePatientRepository(apiClient: MediCareApiClient): PatientRepository {
        return PatientRepository(apiClient)
    }
    
    @Provides
    @Singleton
    fun provideMedicalCaseRepository(apiClient: MediCareApiClient): MedicalCaseRepository {
        return MedicalCaseRepository(apiClient)
    }
    
    @Provides
    @Singleton
    fun provideAIDiagnosisRepository(apiClient: MediCareApiClient): AIDiagnosisRepository {
        return AIDiagnosisRepository(apiClient)
    }
}