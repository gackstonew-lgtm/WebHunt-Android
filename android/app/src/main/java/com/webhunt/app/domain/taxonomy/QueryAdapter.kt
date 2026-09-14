package com.webhunt.app.domain.taxonomy

import com.webhunt.app.data.model.OnlineJobLead

data class NormalizedGeoTarget(
    val countryName: String,
    val isoCode: String,
    val jobicyGeo: String? = null // "usa", "uk", "canada", "emea", "apac", "latam"
)

data class AdaptedProviderQuery(
    val rawQuery: String,
    val cleanQuery: String,
    val tokens: List<String>,
    val primaryTag: String,
    val geo: NormalizedGeoTarget? = null,
    val isWorldwide: Boolean = true
)

object QueryAdapter {

    private val STOPWORDS = setOf(
        "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with", "from",
        "by", "as", "is", "are", "was", "were", "the", "this", "that", "it",
        "remote", "jobs", "job", "work", "seeking", "wanted", "hiring", "openings",
        "roles", "role", "position", "positions", "looking", "candidate"
    )

    // Strict country and region mappings (prevents dangerous substring matches like "us" in "Mauritius" or "Cyprus")
    private val GEO_MAPPING: Map<String, NormalizedGeoTarget> = mapOf(
        // Kenya & East Africa
        "kenya" to NormalizedGeoTarget("Kenya", "KE", "emea"),
        "ke" to NormalizedGeoTarget("Kenya", "KE", "emea"),
        "nairobi" to NormalizedGeoTarget("Kenya", "KE", "emea"),
        "mombasa" to NormalizedGeoTarget("Kenya", "KE", "emea"),
        "uganda" to NormalizedGeoTarget("Uganda", "UG", "emea"),
        "tanzania" to NormalizedGeoTarget("Tanzania", "TZ", "emea"),
        "rwanda" to NormalizedGeoTarget("Rwanda", "RW", "emea"),
        "nigeria" to NormalizedGeoTarget("Nigeria", "NG", "emea"),
        "ghana" to NormalizedGeoTarget("Ghana", "GH", "emea"),
        "south africa" to NormalizedGeoTarget("South Africa", "ZA", "emea"),
        "africa" to NormalizedGeoTarget("Africa", "AF", "emea"),

        // USA & North America
        "united states" to NormalizedGeoTarget("United States", "US", "usa"),
        "usa" to NormalizedGeoTarget("United States", "US", "usa"),
        "us" to NormalizedGeoTarget("United States", "US", "usa"),
        "america" to NormalizedGeoTarget("United States", "US", "usa"),
        "canada" to NormalizedGeoTarget("Canada", "CA", "canada"),
        "ca" to NormalizedGeoTarget("Canada", "CA", "canada"),

        // United Kingdom & Europe
        "united kingdom" to NormalizedGeoTarget("United Kingdom", "UK", "uk"),
        "uk" to NormalizedGeoTarget("United Kingdom", "UK", "uk"),
        "england" to NormalizedGeoTarget("United Kingdom", "UK", "uk"),
        "britain" to NormalizedGeoTarget("United Kingdom", "UK", "uk"),
        "germany" to NormalizedGeoTarget("Germany", "DE", "emea"),
        "france" to NormalizedGeoTarget("France", "FR", "emea"),
        "netherlands" to NormalizedGeoTarget("Netherlands", "NL", "emea"),
        "spain" to NormalizedGeoTarget("Spain", "ES", "emea"),
        "italy" to NormalizedGeoTarget("Italy", "IT", "emea"),
        "switzerland" to NormalizedGeoTarget("Switzerland", "CH", "emea"),
        "ireland" to NormalizedGeoTarget("Ireland", "IE", "emea"),
        "europe" to NormalizedGeoTarget("Europe", "EU", "emea"),
        "eu" to NormalizedGeoTarget("Europe", "EU", "emea"),
        "emea" to NormalizedGeoTarget("Europe, Middle East, Africa", "EMEA", "emea"),

        // Asia & Pacific
        "india" to NormalizedGeoTarget("India", "IN", "apac"),
        "singapore" to NormalizedGeoTarget("Singapore", "SG", "apac"),
        "japan" to NormalizedGeoTarget("Japan", "JP", "apac"),
        "australia" to NormalizedGeoTarget("Australia", "AU", "apac"),
        "new zealand" to NormalizedGeoTarget("New Zealand", "NZ", "apac"),
        "apac" to NormalizedGeoTarget("Asia-Pacific", "APAC", "apac"),
        "asia" to NormalizedGeoTarget("Asia", "ASIA", "apac"),

        // Latin America
        "brazil" to NormalizedGeoTarget("Brazil", "BR", "latam"),
        "mexico" to NormalizedGeoTarget("Mexico", "MX", "latam"),
        "argentina" to NormalizedGeoTarget("Argentina", "AR", "latam"),
        "colombia" to NormalizedGeoTarget("Colombia", "CO", "latam"),
        "latam" to NormalizedGeoTarget("Latin America", "LATAM", "latam")
    )

    private val TECH_PRIORITY = listOf(
        "react", "nextjs", "next.js", "python", "javascript", "typescript",
        "node", "nodejs", "vue", "angular", "rust", "golang", "java", "ruby",
        "devops", "aws", "docker", "kubernetes", "flutter", "swift", "kotlin",
        "frontend", "backend", "fullstack", "design", "figma", "ai", "writer",
        "marketing", "sales", "support", "developer", "engineer"
    )

    /**
     * Strict geographic target normalization avoiding unsafe substring matches.
     * Guaranteed to never match "Mauritius" or "Cyprus" as "US".
     */
    fun normalizeGeoTarget(rawCountry: String?): NormalizedGeoTarget? {
        if (rawCountry.isNullOrBlank()) return null
        val cleaned = rawCountry.trim().lowercase()
        if (cleaned in setOf("worldwide", "global", "anywhere", "all", "worldwide / global")) {
            return null
        }

        // Exact match
        GEO_MAPPING[cleaned]?.let { return it }

        // Tokenized word-boundary match
        val words = cleaned.split(Regex("[\\s,]+"))
        for (w in words) {
            GEO_MAPPING[w]?.let { return it }
        }

        return null
    }

    /**
     * Extracts clean distinct keyword tokens from user query.
     * Normalizes punctuation, slashes, and stopwords while preserving compound tech tokens.
     */
    fun extractQueryTokens(rawQuery: String): List<String> {
        if (rawQuery.isBlank()) return emptyList()

        val normalized = rawQuery
            .lowercase()
            .replace(Regex("[\\\\/|,+&():;?!'\"\\[\\]{}<>]"), " ")
            .replace(Regex("\\s+"), " ")
            .trim()

        val words = normalized.split(" ")
        val tokens = mutableListOf<String>()

        for (w in words) {
            val clean = w.trim()
            if (clean.length > 1 && clean !in STOPWORDS) {
                tokens.add(clean)
            }
        }

        val rawLower = rawQuery.lowercase()
        if ("next.js" in rawLower || "nextjs" in rawLower) {
            if ("next.js" !in tokens) tokens.add("next.js")
            if ("nextjs" !in tokens) tokens.add("nextjs")
        }
        if ("react.js" in rawLower || "reactjs" in rawLower) {
            if ("react" !in tokens) tokens.add("react")
        }
        if ("node.js" in rawLower || "nodejs" in rawLower) {
            if ("node.js" !in tokens) tokens.add("node.js")
            if ("nodejs" !in tokens) tokens.add("nodejs")
        }
        if ("vue.js" in rawLower || "vuejs" in rawLower) {
            if ("vue" !in tokens) tokens.add("vue")
        }

        return tokens.distinct()
    }

    /**
     * Selects single authoritative slug for tag-based APIs (Jobicy, RemoteOK).
     */
    fun selectPrimaryTag(tokens: List<String>, rawQuery: String): String {
        if (tokens.isEmpty()) return "developer"

        for (tp in TECH_PRIORITY) {
            if (tokens.contains(tp)) {
                return when (tp) {
                    "next.js" -> "nextjs"
                    "node.js" -> "nodejs"
                    else -> tp
                }
            }
        }

        return tokens.firstOrNull() ?: "developer"
    }

    /**
     * Adapts raw search query and optional geography into structured query envelope.
     */
    fun adaptQuery(rawQuery: String, country: String? = null): AdaptedProviderQuery {
        val tokens = extractQueryTokens(rawQuery)
        val primaryTag = selectPrimaryTag(tokens, rawQuery)
        val geo = normalizeGeoTarget(country)
        val cleanQuery = if (tokens.isNotEmpty()) tokens.joinToString(" ") else rawQuery.trim()

        return AdaptedProviderQuery(
            rawQuery = rawQuery.trim(),
            cleanQuery = cleanQuery,
            tokens = tokens,
            primaryTag = primaryTag,
            geo = geo,
            isWorldwide = geo == null
        )
    }

    /**
     * Deterministically tests if an opportunity matches query tokens.
     * Uses multi-factor weighted checks across title, company, skills, tags, opportunityType, and description snippet.
     */
    fun leadMatchesSearchTokens(lead: OnlineJobLead, tokens: List<String>): Boolean {
        if (tokens.isEmpty()) return true

        val title = lead.title.lowercase()
        val company = lead.company.lowercase()
        val desc = (lead.descriptionSnippet ?: "").lowercase()
        val tagsStr = lead.tags.joinToString(" ").lowercase()
        val skillsStr = lead.skills.joinToString(" ").lowercase()
        val oppType = (lead.opportunityType ?: "").lowercase()
        val extraText = "$company $tagsStr $skillsStr $oppType"

        // 1. Direct title or metadata token match
        for (tok in tokens) {
            val tokLower = tok.lowercase()
            if (title.contains(tokLower) || extraText.contains(tokLower)) {
                return true
            }
        }

        // 2. Token match in description snippet (requires token length >= 3)
        for (tok in tokens) {
            val tokLower = tok.lowercase()
            if (tokLower.length >= 3 && desc.contains(tokLower)) {
                return true
            }
        }

        return false
    }
}
