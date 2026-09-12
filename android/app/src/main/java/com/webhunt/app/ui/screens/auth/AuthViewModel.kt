package com.webhunt.app.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.webhunt.app.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class AuthTab {
    SIGN_IN,
    REGISTER,
    FORGOT
}

data class AuthUiState(
    val tab: AuthTab = AuthTab.SIGN_IN,
    val name: String = "",
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null
) {
    val isSignInTab: Boolean get() = tab == AuthTab.SIGN_IN
}

class AuthViewModel(private val authRepo: AuthRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    val isAuthenticated = authRepo.isAuthenticated
    val currentUser = authRepo.currentUser

    fun setTab(tab: AuthTab) {
        _uiState.value = _uiState.value.copy(
            tab = tab,
            errorMessage = null,
            successMessage = null
        )
    }

    fun setTab(isSignIn: Boolean) {
        setTab(if (isSignIn) AuthTab.SIGN_IN else AuthTab.REGISTER)
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

    fun setConfirmPassword(confirmPassword: String) {
        _uiState.value = _uiState.value.copy(confirmPassword = confirmPassword)
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(errorMessage = null, successMessage = null)
    }

    fun submit(onSuccess: () -> Unit) {
        val current = _uiState.value
        _uiState.value = current.copy(isLoading = true, errorMessage = null, successMessage = null)

        viewModelScope.launch {
            if (current.tab == AuthTab.SIGN_IN) {
                val res = authRepo.login(current.email.trim(), current.password)
                res.onSuccess {
                    _uiState.value = _uiState.value.copy(isLoading = false, successMessage = "Signed in successfully")
                    onSuccess()
                }.onFailure {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message ?: "Invalid email or password")
                }
            } else if (current.tab == AuthTab.REGISTER) {
                if (current.password != current.confirmPassword) {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = "Passwords do not match. Please verify.")
                    return@launch
                }
                val res = authRepo.register(current.email.trim(), current.name.ifBlank { null }, current.password)
                res.onSuccess {
                    _uiState.value = _uiState.value.copy(isLoading = false, successMessage = "Account registered successfully")
                    onSuccess()
                }.onFailure {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message ?: "Failed to create account")
                }
            }
        }
    }

    fun requestPasswordReset() {
        val current = _uiState.value
        val email = current.email.trim()
        if (email.isBlank()) {
            _uiState.value = current.copy(errorMessage = "Please enter your registered email address.")
            return
        }

        _uiState.value = current.copy(isLoading = true, errorMessage = null, successMessage = null)

        viewModelScope.launch {
            val res = authRepo.forgotPassword(email)
            res.onSuccess { message ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    successMessage = message
                )
            }.onFailure {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = it.message ?: "Failed to request password reset."
                )
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepo.logout()
        }
    }
}
