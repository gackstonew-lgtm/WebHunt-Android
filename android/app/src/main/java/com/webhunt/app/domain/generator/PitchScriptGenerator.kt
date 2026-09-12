package com.webhunt.app.domain.generator

import com.webhunt.app.data.model.PhysicalLead
import com.webhunt.app.data.model.UserProfileData

data class GeneratedPitch(
    val subject: String,
    val greeting: String,
    val body: String,
    val callToAction: String,
    val fullText: String
)

object PitchScriptGenerator {

    fun generate(
        lead: PhysicalLead,
        profile: UserProfileData,
        templateType: String = "local_website_pitch"
    ): GeneratedPitch {
        val businessName = lead.businessName.ifBlank { "Local Business" }
        val niche = lead.category?.ifBlank { "services" } ?: "services"
        val city = lead.city ?: ""
        val country = lead.country.ifBlank { "Kenya" }
        val isKenya = country.contains("Kenya", ignoreCase = true) || lead.phone.startsWith("+254") || lead.phone.startsWith("07")

        val locStr = if (city.isNotBlank()) "in $city" else "in $country"
        val projectRateStr = if (isKenya || profile.currency == "KES") {
            "KES ${profile.projectRateKes?.toLong() ?: 150000} (flexible milestone payments via M-Pesa Till or Bank)"
        } else {
            "$${profile.projectRateUsd?.toLong() ?: 1500}"
        }

        val subject: String
        val greeting = "Hi $businessName team,"
        val body: String
        val callToAction: String

        if (templateType == "local_website_pitch") {
            subject = "Quick question regarding $businessName's online presence"
            body = """
My name is ${profile.fullName}, a web developer based in ${profile.city ?: "Nairobi"}.

I came across $businessName while searching for $niche $locStr. You have a great local presence, but I noticed there is currently no dedicated website or direct 1-click WhatsApp order link connected to your Google listing.

When potential customers search for $niche on their phones, they usually look for fast service details, pricing, and an easy way to reach out immediately. Without a dedicated mobile page, many of those potential customers end up contacting competitors.

Here is what I build for businesses like $businessName:
1. Fast Mobile Website: Loads in under 1 second on all mobile networks.
2. 1-Click WhatsApp & Call Buttons: Customers tap once to chat, order, or book directly with your staff.
3. Google Search & Map Optimization: Helps more local customers discover you first.
4. Transparent Pricing: Starting at $projectRateStr with zero hidden maintenance fees.
            """.trimIndent()

            callToAction = """
I put together a quick 2-minute mockup preview showing what a modern mobile site for $businessName could look like.

Would you be open to me sending over the link via WhatsApp or email so you can take a look?

Best regards,
${profile.fullName}
${profile.professionalTitle}
${if (!profile.phone.isNullOrBlank()) "Phone / WhatsApp: ${profile.phone}" else ""}
${if (!profile.portfolioUrl.isNullOrBlank()) "Previous Client Sites: ${profile.portfolioUrl}" else ""}
            """.trimIndent()
        } else {
            subject = "Digital growth opportunities for $businessName"
            body = """
I am reaching out to share a few practical digital growth ideas for $businessName.

As a digital solutions specialist, I help $niche businesses streamline customer inquiries, reduce booking friction, and capture more direct sales online.

Recommended upgrades for $businessName:
- High-converting mobile website tailored to your brand identity.
- Automated appointment scheduling with WhatsApp reminders to reduce no-shows.
- ${if (isKenya) "Direct M-Pesa Till / Paybill and bank checkout integration." else "Integrated online payment processing."}
- Local SEO setup to capture active search traffic $locStr.
            """.trimIndent()

            callToAction = """
Would you be open to a quick 5-minute call this week to see if these upgrades make sense for $businessName?

Sincerely,
${profile.fullName}
${profile.professionalTitle}
${if (!profile.email.isNullOrBlank()) "Email: ${profile.email}" else ""}
${if (!profile.phone.isNullOrBlank()) "WhatsApp: ${profile.phone}" else ""}
            """.trimIndent()
        }

        val fullText = """
OUTREACH SCRIPT FOR ${businessName.uppercase()} ($country)
Phone: ${lead.phoneFormatted ?: lead.phone}
Niche: $niche
Location: $locStr

SUBJECT: $subject

$greeting

$body

$callToAction
        """.trimIndent()

        return GeneratedPitch(
            subject = subject,
            greeting = greeting,
            body = body,
            callToAction = callToAction,
            fullText = fullText
        )
    }
}
