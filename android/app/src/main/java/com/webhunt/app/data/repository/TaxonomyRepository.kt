package com.webhunt.app.data.repository

import android.content.Context
import com.webhunt.app.data.api.WebHuntApiService
import com.webhunt.app.data.model.CountryOption
import com.webhunt.app.data.model.IndustryCategory
import com.webhunt.app.data.model.IndustryDefinition
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class TaxonomyRepository(
    private val context: Context,
    private val api: WebHuntApiService
) {
    private val _categories = MutableStateFlow<List<IndustryCategory>>(DEFAULT_CATEGORIES)
    val categories: StateFlow<List<IndustryCategory>> = _categories.asStateFlow()

    private val _industries = MutableStateFlow<List<IndustryDefinition>>(DEFAULT_INDUSTRIES)
    val industries: StateFlow<List<IndustryDefinition>> = _industries.asStateFlow()

    private val _countries = MutableStateFlow<List<CountryOption>>(DEFAULT_COUNTRIES)
    val countries: StateFlow<List<CountryOption>> = _countries.asStateFlow()

    suspend fun syncTaxonomy() {
        try {
            val response = api.getTaxonomy()
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.categories.isNotEmpty()) _categories.value = body.categories
                if (body.industries.isNotEmpty()) _industries.value = body.industries
                if (body.countries.isNotEmpty()) _countries.value = body.countries
            }
        } catch (_: Exception) {}
    }

    fun search(query: String, mode: String): List<IndustryDefinition> {
        val q = query.trim().lowercase()
        val all = _industries.value.filter { it.applicableModes.contains(mode) }
        if (q.isBlank()) return all.filter { it.isPopular }

        return all.filter { ind ->
            ind.name.lowercase().contains(q) ||
                    ind.aliases.any { it.lowercase().contains(q) } ||
                    ind.categoryId.lowercase().contains(q)
        }
    }

    fun getIndustriesForCategory(categoryId: String, mode: String): List<IndustryDefinition> {
        return _industries.value.filter {
            it.categoryId.equals(categoryId, ignoreCase = true) && it.applicableModes.contains(mode)
        }
    }

    companion object {
        val DEFAULT_CATEGORIES = listOf(
            IndustryCategory("home_trade", "Home Services & Trade", "Wrench", "Plumbing, electrical, construction, roofing", listOf("physical")),
            IndustryCategory("food_hospitality", "Restaurants & Hospitality", "Utensils", "Restaurants, cafes, bakeries, hotels", listOf("physical")),
            IndustryCategory("health_medical", "Healthcare & Medical", "HeartPulse", "Clinics, dental, pharmacies, therapy", listOf("physical")),
            IndustryCategory("automotive", "Automotive & Transport", "Car", "Garages, auto body, tires, car rentals", listOf("physical")),
            IndustryCategory("professional_legal", "Professional & Legal", "Briefcase", "Law firms, accounting, consulting, audit", listOf("physical", "online")),
            IndustryCategory("beauty_wellness", "Beauty, Spa & Wellness", "Sparkles", "Salons, barbers, spas, gyms, personal trainers", listOf("physical")),
            IndustryCategory("retail_local", "Retail & Local Commerce", "ShoppingBag", "Boutiques, furniture, electronics, hardware", listOf("physical")),
            IndustryCategory("software_development", "Software & Engineering", "Code", "Frontend, backend, mobile, DevOps, full-stack", listOf("online")),
            IndustryCategory("ai_data", "AI, Machine Learning & Data", "BrainCircuit", "AI engineers, data scientists, LLM prompt engineers", listOf("online")),
            IndustryCategory("design_creative", "Design, Creative & UI/UX", "Palette", "UI/UX, product design, graphic design, 3D", listOf("online")),
            IndustryCategory("writing_content", "Writing, Copywriting & Media", "FileText", "Tech writing, SEO content, copywriting, translation", listOf("online")),
            IndustryCategory("virtual_support", "Virtual Assistant & Support", "Headphones", "Customer care, executive assistants, operations", listOf("online"))
        )

        val DEFAULT_INDUSTRIES = listOf(
            // Physical
            IndustryDefinition("plumbing", "Plumbers & Plumbing Services", "home_trade", isPopular = true, applicableModes = listOf("physical"), aliases = listOf("plumber", "pipe repairs", "drain cleaning")),
            IndustryDefinition("electrical", "Electricians & Electrical Contractors", "home_trade", isPopular = true, applicableModes = listOf("physical"), aliases = listOf("electrician", "wiring", "solar installation")),
            IndustryDefinition("auto_repair", "Auto Repair, Mechanics & Garages", "automotive", isPopular = true, applicableModes = listOf("physical"), aliases = listOf("garage", "mechanic", "car service")),
            IndustryDefinition("dental_clinic", "Dentists & Dental Practices", "health_medical", isPopular = true, applicableModes = listOf("physical"), aliases = listOf("dental", "dentist", "orthodontist")),
            IndustryDefinition("restaurants", "Restaurants, Diners & Bistros", "food_hospitality", isPopular = true, applicableModes = listOf("physical"), aliases = listOf("restaurant", "cafe", "bistro", "eatery")),
            IndustryDefinition("barbershops", "Barbershops & Hair Salons", "beauty_wellness", isPopular = true, applicableModes = listOf("physical"), aliases = listOf("barber", "hair salon", "hairdresser")),
            IndustryDefinition("gyms", "Gyms, Fitness Centers & Crossfit", "beauty_wellness", isPopular = true, applicableModes = listOf("physical"), aliases = listOf("gym", "fitness", "workout studio")),
            IndustryDefinition("law_firms", "Law Firms & Attorneys", "professional_legal", isPopular = true, applicableModes = listOf("physical"), aliases = listOf("lawyer", "advocate", "legal counsel")),
            IndustryDefinition("real_estate_agents", "Real Estate Agents & Property Managers", "professional_legal", isPopular = true, applicableModes = listOf("physical"), aliases = listOf("realtor", "property agent", "broker")),
            IndustryDefinition("contractors", "General Contractors & Builders", "home_trade", isPopular = true, applicableModes = listOf("physical"), aliases = listOf("builder", "construction", "masonry")),

            // Online
            IndustryDefinition("react_nextjs", "React & Next.js Developers", "software_development", isPopular = true, applicableModes = listOf("online"), aliases = listOf("react", "next.js", "frontend", "typescript")),
            IndustryDefinition("fullstack_engineer", "Full-Stack Software Engineers", "software_development", isPopular = true, applicableModes = listOf("online"), aliases = listOf("fullstack", "node.js", "python", "postgres")),
            IndustryDefinition("mobile_developer", "Mobile App Developers (Kotlin / Flutter)", "software_development", isPopular = true, applicableModes = listOf("online"), aliases = listOf("android", "kotlin", "flutter", "ios")),
            IndustryDefinition("backend_engineer", "Backend & Cloud Engineers", "software_development", isPopular = true, applicableModes = listOf("online"), aliases = listOf("golang", "python", "django", "aws", "devops")),
            IndustryDefinition("ui_ux_designer", "UI/UX & Product Designers", "design_creative", isPopular = true, applicableModes = listOf("online"), aliases = listOf("figma", "ui designer", "ux research")),
            IndustryDefinition("ai_prompt_engineer", "AI & LLM Application Engineers", "ai_data", isPopular = true, applicableModes = listOf("online"), aliases = listOf("langchain", "openai", "machine learning", "data science")),
            IndustryDefinition("content_copywriter", "Technical & B2B Content Writers", "writing_content", isPopular = true, applicableModes = listOf("online"), aliases = listOf("seo writer", "copywriting", "technical writer")),
            IndustryDefinition("virtual_assistant", "Executive Virtual Assistants", "virtual_support", isPopular = true, applicableModes = listOf("online"), aliases = listOf("va", "remote assistant", "data entry"))
        )

        val DEFAULT_COUNTRIES = listOf(
            CountryOption("Kenya", "KE", "+254", "🇰🇪"),
            CountryOption("United States", "US", "+1", "🇺🇸"),
            CountryOption("United Kingdom", "GB", "+44", "🇬🇧"),
            CountryOption("Canada", "CA", "+1", "🇨🇦"),
            CountryOption("Australia", "AU", "+61", "🇦🇺"),
            CountryOption("Germany", "DE", "+49", "🇩🇪"),
            CountryOption("Nigeria", "NG", "+234", "🇳🇬"),
            CountryOption("South Africa", "ZA", "+27", "🇿🇦"),
            CountryOption("United Arab Emirates", "AE", "+971", "🇦🇪"),
            CountryOption("India", "IN", "+91", "🇮🇳"),
            CountryOption("Uganda", "UG", "+256", "🇺🇬"),
            CountryOption("Tanzania", "TZ", "+255", "🇹🇿"),
            CountryOption("Rwanda", "RW", "+250", "🇷🇼"),
            CountryOption("Ghana", "GH", "+233", "🇬🇭"),
            CountryOption("France", "FR", "+33", "🇫🇷"),
            CountryOption("Worldwide / Global", "WW", "", "🌐")
        )
    }
}
