package com.webhunt.app.ui.navigation

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.webhunt.app.WebHuntApplication
import com.webhunt.app.ui.screens.auth.AuthScreen
import com.webhunt.app.ui.screens.auth.AuthViewModel
import com.webhunt.app.ui.screens.history.HistoryScreen
import com.webhunt.app.ui.screens.history.HistoryViewModel
import com.webhunt.app.ui.screens.home.HomeScreen
import com.webhunt.app.ui.screens.home.HomeViewModel
import com.webhunt.app.ui.screens.pipeline.PipelineScreen
import com.webhunt.app.ui.screens.pipeline.PipelineViewModel
import com.webhunt.app.ui.screens.profile.ProfileScreen
import com.webhunt.app.ui.screens.profile.ProfileViewModel
import com.webhunt.app.ui.screens.subscription.SubscriptionScreen
import com.webhunt.app.ui.screens.subscription.SubscriptionViewModel

@Composable
fun WebHuntNavGraph(
    navController: NavHostController,
    paddingValues: PaddingValues,
    homeViewModel: HomeViewModel,
    pipelineViewModel: PipelineViewModel,
    historyViewModel: HistoryViewModel,
    authViewModel: AuthViewModel,
    subscriptionViewModel: SubscriptionViewModel,
    profileViewModel: ProfileViewModel
) {
    NavHost(
        navController = navController,
        startDestination = NavDestination.Home.route,
        modifier = Modifier.padding(paddingValues)
    ) {
        composable(NavDestination.Home.route) {
            HomeScreen(
                viewModel = homeViewModel,
                onNavigateToAuth = { navController.navigate(NavDestination.Auth.route) },
                onNavigateToSubscription = { navController.navigate(NavDestination.Subscription.route) }
            )
        }

        composable(NavDestination.Pipeline.route) {
            PipelineScreen(
                viewModel = pipelineViewModel
            )
        }

        composable(NavDestination.History.route) {
            HistoryScreen(
                viewModel = historyViewModel,
                onLaunchRadar = {
                    navController.navigate(NavDestination.Home.route)
                },
                onReRunScan = { historyItem ->
                    homeViewModel.runSearchFromHistory(historyItem)
                    navController.navigate(NavDestination.Home.route)
                }
            )
        }

        composable(NavDestination.Subscription.route) {
            SubscriptionScreen(
                viewModel = subscriptionViewModel
            )
        }

        composable(NavDestination.Profile.route) {
            ProfileScreen(
                viewModel = profileViewModel,
                onNavigateToSubscription = {
                    navController.navigate(NavDestination.Subscription.route)
                },
                onLogout = {
                    navController.navigate(NavDestination.Auth.route) {
                        popUpTo(NavDestination.Home.route) {
                            inclusive = false
                        }
                    }
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(NavDestination.Auth.route) {
            AuthScreen(
                viewModel = authViewModel,
                onAuthSuccess = {
                    if (!navController.popBackStack()) {
                        navController.navigate(NavDestination.Home.route) {
                            popUpTo(NavDestination.Home.route) { inclusive = true }
                        }
                    }
                }
            )
        }
    }
}
