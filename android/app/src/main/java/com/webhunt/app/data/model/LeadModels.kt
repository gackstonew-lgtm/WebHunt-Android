package com.webhunt.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class DiscoveredContact(
    val type: String, // "phone", "email", "whatsapp", "social", "contact_page", "booking_page"
    val value: String,
    val formattedValue: String? = null,
    val platform: String? = null,
    val label: String? = null,
    val source: String? = null,
    val sourceUrl: String? = null,
    val verified: Boolean = false,
    val status: String? = null
)

@Serializable
data class SocialProfiles(
    val facebook: String? = null,
    val instagram: String? = null,
    val linkedin: String? = null,
    val twitter: String? = null,
    val youtube: String? = null,
    val tiktok: String? = null,
    val telegram: String? = null
)

@Serializable
data class EnrichedLeadContacts(
    val phones: List<DiscoveredContact> = emptyList(),
    val emails: List<DiscoveredContact> = emptyList(),
    val whatsapp: List<DiscoveredContact> = emptyList(),
    val socials: List<DiscoveredContact> = emptyList(),
    val contactPages: List<DiscoveredContact> = emptyList(),
    val bookingPages: List<DiscoveredContact> = emptyList(),
    val primaryPhone: String = "",
    val primaryPhoneFormatted: String? = null,
    val primaryEmail: String? = null,
    val primaryWhatsApp: String? = null,
    val primaryContactPage: String? = null,
    val primaryBookingPage: String? = null,
    val hasContactForm: Boolean = false,
    val socialProfiles: SocialProfiles? = null,
    val lastEnrichedAt: String? = null
)

@Serializable
data class PhysicalLead(
    val id: String,
    val type: String = "physical",
    val businessName: String,
    val phone: String,
    val phoneFormatted: String? = null,
    val phoneStatus: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val country: String,
    val postalCode: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val category: String? = null,
    val rating: Double? = null,
    val reviewCount: Int? = null,
    val hasWebsite: Boolean = false,
    val websiteUrl: String? = null,
    val noWebsiteConfidence: String? = "High",
    val sourceProvider: String = "osm",
    val sourceUrl: String? = null,
    val sourceType: String? = null,
    val providerPlaceId: String? = null,
    val status: String = "NEW",
    val estimatedValue: Double = 1500.0,
    val notes: String? = null,
    val tags: List<String> = emptyList(),
    val relevanceScore: Double? = null,
    val dataQualityScore: Double? = null,
    val verificationStatus: String? = null,
    val email: String? = null,
    val whatsapp: String? = null,
    val contactPageUrl: String? = null,
    val bookingUrl: String? = null,
    val hasContactForm: Boolean = false,
    val socialProfiles: SocialProfiles? = null,
    val contacts: List<DiscoveredContact> = emptyList(),
    val enrichment: EnrichedLeadContacts? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class OnlineJobLead(
    val id: String,
    val type: String = "online",
    val title: String,
    val company: String,
    val companyLogo: String? = null,
    val location: String,
    val country: String? = null,
    val isRemote: Boolean = true,
    val remoteType: String? = "worldwide",
    val category: String? = null,
    val tags: List<String> = emptyList(),
    val url: String,
    val postedDate: String,
    val salary: String? = null,
    val source: String,
    val sourceId: String? = null,
    val sourceUrl: String? = null,
    val sourceType: String? = null,
    val descriptionSnippet: String? = null,
    val status: String = "NEW",
    val estimatedValue: Double = 1500.0,
    val notes: String? = null,
    val relevanceScore: Double? = null,
    val dataQualityScore: Double? = null,
    val verificationStatus: String? = null,
    val email: String? = null,
    val whatsapp: String? = null,
    val contactPageUrl: String? = null,
    val bookingUrl: String? = null,
    val hasContactForm: Boolean = false,
    val socialProfiles: SocialProfiles? = null,
    val contacts: List<DiscoveredContact> = emptyList(),
    val enrichment: EnrichedLeadContacts? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
sealed class UnifiedLead {
    abstract val id: String
    abstract val displayName: String
    abstract val subtitle: String
    abstract val status: String
    abstract val estimatedValue: Double
    abstract val notes: String?
    abstract val phoneOrUrl: String
    abstract val email: String?
    abstract val whatsapp: String?
}
