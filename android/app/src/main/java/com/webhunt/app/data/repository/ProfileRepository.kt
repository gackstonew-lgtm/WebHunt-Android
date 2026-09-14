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
                val errorMsg = com.webhunt.app.util.NetworkErrorHandler.getHttpErrorMessage(response, "Failed to fetch profile")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            val msg = com.webhunt.app.util.NetworkErrorHandler.getReadableErrorMessage(e, "Failed to fetch profile")
            Result.failure(Exception(msg, e))
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
                val errorMsg = com.webhunt.app.util.NetworkErrorHandler.getHttpErrorMessage(response, "Failed to update profile")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            val msg = com.webhunt.app.util.NetworkErrorHandler.getReadableErrorMessage(e, "Failed to update profile")
            Result.failure(Exception(msg, e))
        }
    }

    fun clear() {
        _profile.value = UserProfileData()
    }
}
