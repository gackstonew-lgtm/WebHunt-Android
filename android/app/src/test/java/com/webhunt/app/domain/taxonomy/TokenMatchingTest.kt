package com.webhunt.app.domain.taxonomy

import com.webhunt.app.data.model.OnlineJobLead
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TokenMatchingTest {

    @Test
    fun testTokenMatching_ReactAndNextJsDeveloper() {
        val query = "React / Next.js Developer"
        val tokens = QueryAdapter.extractQueryTokens(query)

        // Opportunity 1: Senior React Engineer (Matches 'react')
        val job1 = OnlineJobLead(
            id = "job1",
            title = "Senior React Engineer",
            company = "FinTech Labs",
            tags = listOf("react", "typescript")
        )
        assertTrue("Tokens should match 'Senior React Engineer'", QueryAdapter.leadMatchesSearchTokens(job1, tokens))

        // Opportunity 2: Next.js Frontend Developer (Matches 'next.js' and 'developer')
        val job2 = OnlineJobLead(
            id = "job2",
            title = "Frontend Developer",
            company = "Acme Corp",
            tags = listOf("next.js", "tailwind")
        )
        assertTrue("Tokens should match job with 'next.js' in tags and 'developer' in title", QueryAdapter.leadMatchesSearchTokens(job2, tokens))

        // Opportunity 3: Python Data Analyst (No match)
        val job3 = OnlineJobLead(
            id = "job3",
            title = "Python Data Analyst",
            company = "DataWorks",
            tags = listOf("python", "sql", "pandas"),
            descriptionSnippet = "Analyze datasets using pandas and PostgreSQL"
        )
        assertFalse("Tokens should NOT match Python Data Analyst", QueryAdapter.leadMatchesSearchTokens(job3, tokens))
    }

    @Test
    fun testTokenMatching_DescriptionSnippet() {
        val tokens = listOf("kotlin", "compose")
        val job = OnlineJobLead(
            id = "job_snippet",
            title = "Mobile App Architect",
            company = "Android Ventures",
            descriptionSnippet = "We are migrating our legacy XML codebase to Jetpack Compose with pure Kotlin coroutines"
        )
        assertTrue("Tokens should match when keywords appear in description snippet", QueryAdapter.leadMatchesSearchTokens(job, tokens))
    }

    @Test
    fun testOpportunityClassificationMatching() {
        val lead = OnlineJobLead(
            id = "ai_task_1",
            title = "RLHF Coding Evaluator",
            company = "Outlier AI",
            opportunityType = "ai_task",
            tags = listOf("python", "evaluation")
        )

        assertTrue(lead.opportunityType == "ai_task")
        assertTrue(lead.displayOpportunityType == "AI Task")

        val contractLead = OnlineJobLead(
            id = "contract_1",
            title = "DevOps Specialist",
            company = "Cloud Corp",
            opportunityType = "contract"
        )
        assertTrue(contractLead.displayOpportunityType == "Contract")
    }
}
