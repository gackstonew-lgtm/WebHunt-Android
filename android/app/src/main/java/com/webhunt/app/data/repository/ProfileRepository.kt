package com.webhunt.app.data.repository

import com.webhunt.app.data.api.WebHuntApiService
import com.webhunt.app.data.model.UserProfileData
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class ProfileRepository(private val api: WebHuntApiService) {

    private val _profile = MutableStateFlow(UserProfileData())
    val profile: StateFlow<UserProfileData> = _profile.asStateFlow()

    suspend fun fetchProfile(): Result<UserProfileData> {
        return try {
            val response = api.getProfile()
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                val data = response.body()!!.data!!
                _profile.value = data
                Result.success(data)
            } else {
                Result.failure(Exception("Failed to fetch profile"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateProfile(data: UserProfileData): Result<UserProfileData> {
        return try {
            val response = api.updateProfile(data)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                val updated = response.body()!!.data!!
                _profile.value = updated
                Result.success(updated)
            } else {
                Result.failure(Exception("Failed to update profile"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
