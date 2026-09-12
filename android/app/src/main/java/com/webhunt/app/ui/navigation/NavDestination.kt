package com.webhunt.app.ui.navigation

sealed class NavDestination(val route: String) {
    object Home : NavDestination("home")
    object Pipeline : NavDestination("pipeline")
    object Subscription : NavDestination("subscription")
    object Profile : NavDestination("profile")
    object Auth : NavDestination("auth")
}
