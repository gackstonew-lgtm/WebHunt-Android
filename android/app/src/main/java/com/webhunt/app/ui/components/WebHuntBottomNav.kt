package com.webhunt.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Radar
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.webhunt.app.ui.navigation.NavDestination
import com.webhunt.app.ui.theme.WebHuntTheme

data class NavItem(
    val destination: NavDestination,
    val label: String,
    val icon: ImageVector,
    val badgeCount: Int = 0
)

@Composable
fun WebHuntBottomNav(
    currentRoute: String,
    pipelineBadgeCount: Int = 0,
    onNavigate: (NavDestination) -> Unit,
    modifier: Modifier = Modifier
) {
    val items = listOf(
        NavItem(NavDestination.Home, "Radar", Icons.Default.Radar),
        NavItem(NavDestination.Pipeline, "CRM", Icons.Default.Layers, pipelineBadgeCount),
        NavItem(NavDestination.History, "History", Icons.Default.History),
        NavItem(NavDestination.Subscription, "Plans", Icons.Default.CreditCard)
    )

    val colors = WebHuntTheme.colors

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(colors.background.copy(alpha = 0.96f))
            .border(width = 1.dp, color = colors.border)
            .navigationBarsPadding()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            items.forEach { item ->
                val selected = currentRoute == item.destination.route

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .clickable { onNavigate(item.destination) }
                        .padding(horizontal = 14.dp, vertical = 4.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (selected) colors.primaryAction else androidx.compose.ui.graphics.Color.Transparent)
                                .padding(horizontal = 12.dp, vertical = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.label,
                                tint = if (selected) colors.onPrimaryAction else colors.mutedText,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        if (item.badgeCount > 0) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .clip(CircleShape)
                                    .background(colors.primaryAction)
                                    .border(1.5.dp, colors.background, CircleShape)
                                    .padding(horizontal = 4.dp, vertical = 0.5.dp)
                            ) {
                                Text(
                                    text = if (item.badgeCount > 99) "99+" else item.badgeCount.toString(),
                                    color = colors.onPrimaryAction,
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    Text(
                        text = item.label,
                        color = if (selected) colors.primaryText else colors.mutedText,
                        fontSize = 10.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
                    )
                }
            }
        }
    }
}

