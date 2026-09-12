package com.webhunt.app.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.webhunt.app.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val isSignInTab: Boolean = true,
    val name: String = "",
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null
)

class AuthViewModel(private val authRepo: AuthRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    val isAuthenticated = authRepo.isAuthenticated
    val currentUser = authRepo.currentUser

    fun setTab(isSignIn: Boolean) {
        _uiState.value = _uiState.value.copy(
            isSignInTab = isSignIn,
            errorMessage = null,
            successMessage = null
        )
    }

    fun setName(name: String) {
        _uiState.value = _uiState.value.copy(name = name)
    }

    fun setEmail(email: String) {
        _uiState.value = _uiState.value.copy(email = email)
    }

    fun setPassword(password: String) {
        _uiState.value = _uiState.value.copy(password = password)
    }

    fun submit(onSuccess: () -> Unit) {
        val current = _uiState.value
        _uiState.value = current.copy(isLoading = true, errorMessage = null, successMessage = null)

        viewModelScope.launch {
            if (current.isSignInTab) {
                val res = authRepo.login(current.email, current.password)
                res.onSuccess {
                    _uiState.value = _uiState.value.copy(isLoading = false, successMessage = "Signed in successfully")
                    onSuccess()
                }.onFailure {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message ?: "Invalid email or password")
                }
            } else {
                val res = authRepo.register(current.email, current.name.ifBlank { null }, current.password)
                res.onSuccess {
                    _uiState.value = _uiState.value.copy(isLoading = false, successMessage = "Account registered successfully")
                    onSuccess()
                }.onFailure {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message ?: "Failed to create account")
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepo.logout()
        }
    }
}
