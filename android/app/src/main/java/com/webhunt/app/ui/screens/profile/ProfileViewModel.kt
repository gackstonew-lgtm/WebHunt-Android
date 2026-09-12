package com.webhunt.app.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.webhunt.app.data.model.UserProfileData
import com.webhunt.app.data.repository.ProfileRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProfileUiState(
    val profile: UserProfileData = UserProfileData(),
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val saveSuccess: Boolean = false,
    val errorMessage: String? = null
)

class ProfileViewModel(private val profileRepo: ProfileRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    fun loadProfile() {
        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
        viewModelScope.launch {
            val res = profileRepo.fetchProfile()
            res.onSuccess {
                _uiState.value = _uiState.value.copy(profile = it, isLoading = false)
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message)
            }
        }
    }

    fun updateField(block: (UserProfileData) -> UserProfileData) {
        val current = _uiState.value.profile
        _uiState.value = _uiState.value.copy(profile = block(current), saveSuccess = false)
    }

    fun saveProfile() {
        _uiState.value = _uiState.value.copy(isSaving = true, errorMessage = null, saveSuccess = false)
        viewModelScope.launch {
            val res = profileRepo.updateProfile(_uiState.value.profile)
            res.onSuccess {
                _uiState.value = _uiState.value.copy(profile = it, isSaving = false, saveSuccess = true)
            }.onFailure {
                _uiState.value = _uiState.value.copy(isSaving = false, errorMessage = it.message)
            }
        }
    }
}
