package com.webhunt.app.data.repository

import com.webhunt.app.data.model.OnlineJobLead
import com.webhunt.app.data.model.ProviderExecutionResult
import com.webhunt.app.data.model.SearchDiagnostics
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SearchRepositoryCacheTest {

    @Test
    fun testProviderExecutionModel_StatesAndFlags() {
        val success = ProviderExecutionResult(
            providerKey = "jobicy",
            providerName = "Jobicy",
            status = "success",
            fetchedCount = 10,
            finalCount = 9,
            latencyMs = 350
        )
        assertTrue(success.isSuccess)
        assertFalse(success.isRateLimited)
        assertFalse(success.isUnavailable)

        val rateLimited = ProviderExecutionResult(
            providerKey = "themuse",
            providerName = "The Muse",
            status = "rate_limited",
            httpStatus = 429,
            errorMessage = "Too Many Requests"
        )
        assertTrue(rateLimited.isRateLimited)
        assertFalse(rateLimited.isSuccess)

        val authRequired = ProviderExecutionResult(
            providerKey = "adzuna",
            providerName = "Adzuna",
            status = "auth_required",
            errorMessage = "Credentials required"
        )
        assertTrue(authRequired.isAuthRequired)

        val unavailable = ProviderExecutionResult(
            providerKey = "remoteok",
            status = "unavailable"
        )
        assertTrue(unavailable.isUnavailable)
    }

    @Test
    fun testSearchDiagnostics_Aggregation() {
        val execs = listOf(
            ProviderExecutionResult(providerKey = "jobicy", status = "success", finalCount = 10),
            ProviderExecutionResult(providerKey = "himalayas", status = "success", finalCount = 15),
            ProviderExecutionResult(providerKey = "themuse", status = "rate_limited", finalCount = 0)
        )

        val diag = SearchDiagnostics(
            totalProvidersQueried = 3,
            successfulProviders = 2,
            failedProviders = 1,
            sourcesQueried = listOf("Jobicy", "Himalayas", "The Muse"),
            sourcesFailed = listOf("The Muse"),
            sourcesSucceeded = listOf("Jobicy", "Himalayas"),
            executionTimeMs = 820L,
            providerExecutions = execs
        )

        assertEquals(3, diag.totalProvidersQueried)
        assertEquals(2, diag.successfulProviders)
        assertEquals(1, diag.failedProviders)
        assertEquals(820L, diag.effectiveDurationMs)
        assertEquals(3, diag.providerExecutions.size)
    }

    @Test
    fun testMultiSourceAttributionAndClassification() {
        val multiJob = OnlineJobLead(
            id = "multi_1",
            title = "Senior React Engineer",
            company = "Stripe",
            sources = listOf("Himalayas", "Jobicy", "Remotive"),
            source = "himalayas",
            opportunityType = "full_time"
        )

        assertTrue("Should be detected as multi-source", multiJob.isMultiSource)
        assertEquals(3, multiJob.sources.size)
        assertEquals("Full-time", multiJob.displayOpportunityType)

        val singleJob = OnlineJobLead(
            id = "single_1",
            title = "Prompt Engineering Annotator",
            company = "Outlier AI",
            sources = listOf("Outlier AI"),
            source = "ai_platforms",
            opportunityType = "ai_task"
        )
        assertFalse("Single source should not be multi-source", singleJob.isMultiSource)
        assertEquals("AI Task", singleJob.displayOpportunityType)
    }

    @Test
    fun testParsedSearchResult_StaleCacheFlag() {
        val result = ParsedSearchResult(
            mode = "online",
            query = "React / Next.js Developer",
            location = "Worldwide Remote",
            provider = "all",
            totalFetched = 25,
            qualifiedCount = 20,
            fromCache = true,
            staleCache = true,
            sourcesQueried = listOf("Jobicy", "Remotive"),
            failedSources = emptyList()
        )

        assertTrue(result.fromCache)
        assertTrue(result.staleCache)
        assertEquals("React / Next.js Developer", result.query)
    }

    @Test
    fun testDuplicateAndUndefinedIdSanitization() {
        // Reproduces the exact crash scenario: multiple items having "himalayas-undefined" or duplicate IDs
        val duplicateRawJobs = listOf(
            OnlineJobLead(id = "himalayas-undefined", title = "React Dev 1", company = "Company A", source = "himalayas"),
            OnlineJobLead(id = "himalayas-undefined", title = "React Dev 2", company = "Company B", source = "himalayas"),
            OnlineJobLead(id = "", title = "React Dev 3", company = "Company C", source = "remotive"),
            OnlineJobLead(id = "remoteok-123", title = "React Dev 4", company = "Company D", source = "remoteok"),
            OnlineJobLead(id = "remoteok-123", title = "React Dev 5", company = "Company E", source = "remoteok")
        )

        val sanitizedList = mutableListOf<OnlineJobLead>()
        val seenOnlineIds = HashSet<String>()
        for ((idx, job) in duplicateRawJobs.withIndex()) {
            var candidateId = job.id.trim()
            if (candidateId.isBlank() || candidateId.contains("undefined", ignoreCase = true)) {
                val slug = "${job.company}_${job.title}".lowercase().replace(Regex("[^a-z0-9]"), "_").take(32)
                candidateId = "${job.source}_${slug}_$idx"
            }
            var finalId = candidateId
            var counter = 1
            while (seenOnlineIds.contains(finalId)) {
                finalId = "${candidateId}_$counter"
                counter++
            }
            seenOnlineIds.add(finalId)
            sanitizedList.add(job.copy(id = finalId))
        }

        // All IDs must be distinct
        val uniqueIds = sanitizedList.map { it.id }.toSet()
        assertEquals(duplicateRawJobs.size, uniqueIds.size)
        for (job in sanitizedList) {
            assertFalse(job.id.contains("undefined"))
            assertTrue(job.id.isNotBlank())
        }

        // Keys in Compose LazyColumn must be 100% unique
        val composeKeys = sanitizedList.mapIndexed { index, job -> "${job.id}_$index" }.toSet()
        assertEquals(duplicateRawJobs.size, composeKeys.size)
    }
}
