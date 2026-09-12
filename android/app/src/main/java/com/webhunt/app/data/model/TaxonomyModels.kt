package com.webhunt.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class IndustryCategory(
    val id: String,
    val name: String,
    val icon: String? = null,
    val description: String? = null,
    val applicableModes: List<String> = listOf("physical", "online")
)

@Serializable
data class BusinessTerms(
    val queryTerms: List<String> = emptyList()
)

@Serializable
data class JobTerms(
    val titles: List<String> = emptyList(),
    val keywords: List<String> = emptyList(),
    val category: String? = null
)

@Serializable
data class IndustryDefinition(
    val id: String,
    val name: String,
    val categoryId: String,
    val isPopular: Boolean = false,
    val applicableModes: List<String> = listOf("physical", "online"),
    val aliases: List<String> = emptyList()
)

@Serializable
data class CountryOption(
    val name: String,
    val code: String,
    val dialCode: String,
    val flag: String
)

@Serializable
data class TaxonomyResponse(
    val success: Boolean = true,
    val categories: List<IndustryCategory> = emptyList(),
    val industries: List<IndustryDefinition> = emptyList(),
    val countries: List<CountryOption> = emptyList(),
    val error: String? = null
)
