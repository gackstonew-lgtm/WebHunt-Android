package com.webhunt.app.ui.navigation

sealed class NavDestination(val route: String) {
    object Home : NavDestination("radar")
    object Pipeline : NavDestination("crm")
    object History : NavDestination("history")
    object Subscription : NavDestination("plans")
    object Profile : NavDestination("profile")
    object Auth : NavDestination("auth")
}
