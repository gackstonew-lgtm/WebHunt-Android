package com.webhunt.app.data.model

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonPrimitive

/**
 * Robust serializer that handles either a JSON array (["a", "b"]),
 * a single string ("a"), a comma-delimited string ("a,b"), or null.
 */
object FlexibleStringListSerializer : KSerializer<List<String>> {
    override val descriptor: SerialDescriptor = ListSerializer(String.serializer()).descriptor

    override fun serialize(encoder: Encoder, value: List<String>) {
        ListSerializer(String.serializer()).serialize(encoder, value)
    }

    override fun deserialize(decoder: Decoder): List<String> {
        val input = decoder as? JsonDecoder ?: return emptyList()
        val element = input.decodeJsonElement()
        return when (element) {
            is JsonArray -> {
                element.mapNotNull { item ->
                    try {
                        if (item is JsonPrimitive) item.content else item.toString()
                    } catch (_: Exception) {
                        null
                    }
                }
            }
            is JsonPrimitive -> {
                val str = element.content.trim()
                if (str.isEmpty()) emptyList()
                else if (str.contains(",")) str.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                else listOf(str)
            }
            else -> emptyList()
        }
    }
}

@Serializable
data class DiscoveredContact(
    val type: String = "phone", // "phone", "email", "whatsapp", "social", "contact_page", "booking_page"
    val value: String = "",
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
    val id: String = "",
    val type: String = "physical",
    val businessName: String = "Unknown Business",
    val phone: String = "",
    val phoneFormatted: String? = null,
    val phoneStatus: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val country: String = "Kenya",
    val postalCode: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val category: String? = null,
    val rating: Double? = null,
    val reviewCount: Int? = null,
    val hasWebsite: Boolean = false,
    val websiteUrl: String? = null,
    val websiteStatus: String? = null,
    val noWebsiteConfidence: String? = "High",
    val sourceProvider: String = "osm",
    val sourceUrl: String? = null,
    val sourceType: String? = null,
    val providerPlaceId: String? = null,
    val status: String = "NEW",
    val estimatedValue: Double = 1500.0,
    val notes: String? = null,
    @Serializable(with = FlexibleStringListSerializer::class)
    val tags: List<String> = emptyList(),
    val relevanceScore: Double? = null,
    val contactQualityScore: Double? = null,
    val dataQualityScore: Double? = null,
    val verificationStatus: String? = null,
    @Serializable(with = FlexibleStringListSerializer::class)
    val sources: List<String> = emptyList(),
    val provenance: List<JobProvenance> = emptyList(),
    val email: String? = null,
    @Serializable(with = FlexibleStringListSerializer::class)
    val emails: List<String> = emptyList(),
    val whatsapp: String? = null,
    val contactPageUrl: String? = null,
    val bookingUrl: String? = null,
    val hasContactForm: Boolean = false,
    val socialProfiles: SocialProfiles? = null,
    val contacts: List<DiscoveredContact> = emptyList(),
    val enrichment: EnrichedLeadContacts? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val retrievedAt: String? = null,
    val lastVerifiedAt: String? = null
) {
    val isPhoneAvailable: Boolean
        get() = phone.isNotBlank() &&
                !phone.startsWith("unlisted-") &&
                phoneStatus != "unavailable" &&
                phoneFormatted != "Phone unavailable"

    val displayPhone: String
        get() = if (isPhoneAvailable) (phoneFormatted?.takeIf { it.isNotBlank() && it != "Phone unavailable" } ?: phone) else "Phone unavailable"

    fun getWebsiteStatusLabel(): String {
        return when (websiteStatus?.uppercase()) {
            "NO_WEBSITE" -> "No Website"
            "SOCIAL_ONLY" -> "Social Only"
            "BROKEN_WEBSITE" -> "Broken Link"
            "WEBSITE_FOUND" -> "Website Found"
            else -> if (hasWebsite) "Website Found" else "No Website (${noWebsiteConfidence ?: "High"})"
        }
    }
}

@Serializable
data class JobProvenance(
    val source: String = "",
    val sourceUrl: String? = null,
    val retrievedAt: String? = null
)

@Serializable
data class OnlineJobLead(
    val id: String = "",
    val type: String = "online",
    val title: String = "Remote Opportunity",
    val company: String = "Remote Employer",
    val employer: String? = null,
    val companyLogo: String? = null,
    val location: String = "Worldwide",
    val country: String? = null,
    val isRemote: Boolean = true,
    val remoteType: String? = "worldwide",
    val category: String? = null,
    @Serializable(with = FlexibleStringListSerializer::class)
    val tags: List<String> = emptyList(),
    @Serializable(with = FlexibleStringListSerializer::class)
    val skills: List<String> = emptyList(),
    val eligibility: String? = null,
    val url: String = "",
    val applicationUrl: String? = null,
    val originalUrl: String? = null,
    val postedDate: String = "",
    val publishedAt: String? = null,
    val salary: String? = null,
    val source: String = "online",
    val sourceId: String? = null,
    val sourceUrl: String? = null,
    val sourceType: String? = null,
    @Serializable(with = FlexibleStringListSerializer::class)
    val sources: List<String> = emptyList(),
    val provenance: List<JobProvenance> = emptyList(),
    val descriptionSnippet: String? = null,
    val status: String = "NEW",
    val estimatedValue: Double = 1500.0,
    val notes: String? = null,
    val relevanceScore: Double? = null,
    val contactQualityScore: Double? = null,
    val dataQualityScore: Double? = null,
    val verificationStatus: String? = null,
    val websiteStatus: String? = null,
    val opportunityType: String? = null, // "full_time", "part_time", "contract", "freelance", "internship", "hackathon", "bounty", "ai_task", "other", null
    val aiTaskType: String? = null,
    val aiTaskCategory: String? = null,
    val taskCompensationType: String? = null,
    val taskCompensationAmount: String? = null,
    val taskCompensationCurrency: String? = null,
    val estimatedTaskDuration: String? = null,
    val countryEligibility: String? = null,
    val projectAvailability: String? = null,
    val contractorStatus: String? = null,
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
) {
    val displayEmployer: String
        get() = employer?.takeIf { it.isNotBlank() } ?: company

    val displayApplicationUrl: String
        get() = applicationUrl?.takeIf { it.isNotBlank() } ?: originalUrl?.takeIf { it.isNotBlank() } ?: url

    val displaySkills: List<String>
        get() = if (skills.isNotEmpty()) skills else tags

    val isMultiSource: Boolean
        get() = sources.size > 1

    val displayOpportunityType: String?
        get() = when (opportunityType?.lowercase()?.trim()) {
            "full_time" -> "Full-time"
            "part_time" -> "Part-time"
            "contract" -> "Contract"
            "freelance" -> "Freelance"
            "internship" -> "Internship"
            "hackathon" -> "Hackathon"
            "bounty" -> "Bounty"
            "ai_task" -> "AI Task"
            "other" -> "Opportunity"
            else -> opportunityType
        }

    val normalizedRelevanceScore: Int?
        get() = relevanceScore?.let { score ->
            if (score <= 1.0 && score > 0.0) {
                (score * 100).toInt().coerceIn(0, 100)
            } else {
                score.toInt().coerceIn(0, 100)
            }
        }
}

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
