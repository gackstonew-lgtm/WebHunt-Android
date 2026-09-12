package com.webhunt.app.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.webhunt.app.WebHuntApplication
import com.webhunt.app.ui.components.WebHuntBottomNav
import com.webhunt.app.ui.components.WebHuntTopBar
import com.webhunt.app.ui.navigation.NavDestination
import com.webhunt.app.ui.navigation.WebHuntNavGraph
import com.webhunt.app.ui.screens.auth.AuthViewModel
import com.webhunt.app.ui.screens.home.HomeViewModel
import com.webhunt.app.ui.screens.pipeline.PipelineViewModel
import com.webhunt.app.ui.screens.profile.ProfileViewModel
import com.webhunt.app.ui.screens.subscription.SubscriptionViewModel
import com.webhunt.app.ui.theme.WebHuntBlack
import com.webhunt.app.ui.theme.WebHuntTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as WebHuntApplication

        val homeViewModel: HomeViewModel by viewModels {
            object : ViewModelProvider.Factory {
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    @Suppress("UNCHECKED_CAST")
                    return HomeViewModel(
                        app.searchRepository,
                        app.pipelineRepository,
                        app.taxonomyRepository,
                        app.authRepository,
                        app.profileRepository
                    ) as T
                }
            }
        }

        val pipelineViewModel: PipelineViewModel by viewModels {
            object : ViewModelProvider.Factory {
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    @Suppress("UNCHECKED_CAST")
                    return PipelineViewModel(
                        app.pipelineRepository,
                        app.profileRepository
                    ) as T
                }
            }
        }

        val authViewModel: AuthViewModel by viewModels {
            object : ViewModelProvider.Factory {
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    @Suppress("UNCHECKED_CAST")
                    return AuthViewModel(app.authRepository) as T
                }
            }
        }

        val subscriptionViewModel: SubscriptionViewModel by viewModels {
            object : ViewModelProvider.Factory {
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    @Suppress("UNCHECKED_CAST")
                    return SubscriptionViewModel(app.subscriptionRepository) as T
                }
            }
        }

        val profileViewModel: ProfileViewModel by viewModels {
            object : ViewModelProvider.Factory {
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    @Suppress("UNCHECKED_CAST")
                    return ProfileViewModel(app.profileRepository) as T
                }
            }
        }

        setContent {
            WebHuntTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route ?: NavDestination.Home.route

                val isAuthenticated by app.sessionManager.isAuthenticated.collectAsState()
                val savedLeadsCount by app.pipelineRepository.savedLeadIds.collectAsState()

                Scaffold(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(WebHuntBlack),
                    containerColor = WebHuntBlack,
                    topBar = {
                        WebHuntTopBar(
                            isAuthenticated = isAuthenticated,
                            onAuthClick = {
                                if (currentRoute != NavDestination.Auth.route) {
                                    navController.navigate(NavDestination.Auth.route)
                                }
                            }
                        )
                    },
                    bottomBar = {
                        WebHuntBottomNav(
                            currentRoute = currentRoute,
                            pipelineBadgeCount = savedLeadsCount.size,
                            onNavigate = { dest ->
                                if (currentRoute != dest.route) {
                                    navController.navigate(dest.route) {
                                        popUpTo(NavDestination.Home.route) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            }
                        )
                    }
                ) { innerPadding ->
                    WebHuntNavGraph(
                        navController = navController,
                        paddingValues = innerPadding,
                        homeViewModel = homeViewModel,
                        pipelineViewModel = pipelineViewModel,
                        authViewModel = authViewModel,
                        subscriptionViewModel = subscriptionViewModel,
                        profileViewModel = profileViewModel
                    )
                }
            }
        }
    }
}
