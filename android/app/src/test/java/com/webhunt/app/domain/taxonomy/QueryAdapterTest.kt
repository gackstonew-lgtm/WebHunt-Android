package com.webhunt.app.domain.taxonomy

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class QueryAdapterTest {

    @Test
    fun testSlashAndPunctuationExtraction() {
        val query = "React / Next.js Developer"
        val tokens = QueryAdapter.extractQueryTokens(query)

        assertTrue("Should contain 'react'", tokens.contains("react"))
        assertTrue("Should contain 'next.js'", tokens.contains("next.js"))
        assertTrue("Should contain 'nextjs'", tokens.contains("nextjs"))
        assertTrue("Should contain 'developer'", tokens.contains("developer"))
        assertFalse("Should not contain punctuation slashes", tokens.contains("/"))
    }

    @Test
    fun testCompoundTechPreservation() {
        val nodeQuery = "Node.js / Express Backend Engineer"
        val nodeTokens = QueryAdapter.extractQueryTokens(nodeQuery)

        assertTrue("Should contain 'node.js'", nodeTokens.contains("node.js"))
        assertTrue("Should contain 'nodejs'", nodeTokens.contains("nodejs"))
        assertTrue("Should contain 'backend'", nodeTokens.contains("backend"))
        assertTrue("Should contain 'engineer'", nodeTokens.contains("engineer"))
    }

    @Test
    fun testStopwordsStripping() {
        val raw = "Looking for remote React Developer jobs with TypeScript"
        val tokens = QueryAdapter.extractQueryTokens(raw)

        assertFalse("Stopword 'looking' should be stripped", tokens.contains("looking"))
        assertFalse("Stopword 'for' should be stripped", tokens.contains("for"))
        assertFalse("Stopword 'remote' should be stripped", tokens.contains("remote"))
        assertFalse("Stopword 'jobs' should be stripped", tokens.contains("jobs"))
        assertFalse("Stopword 'with' should be stripped", tokens.contains("with"))

        assertTrue("Key term 'react' should be preserved", tokens.contains("react"))
        assertTrue("Key term 'typescript' should be preserved", tokens.contains("typescript"))
        assertTrue("Key term 'developer' should be preserved", tokens.contains("developer"))
    }

    @Test
    fun testPrimaryTagSelection() {
        val tokens = listOf("react", "next.js", "nextjs", "developer")
        val primaryTag = QueryAdapter.selectPrimaryTag(tokens, "React / Next.js Developer")
        assertEquals("react", primaryTag)

        val nextTokens = listOf("next.js", "nextjs", "frontend")
        val nextTag = QueryAdapter.selectPrimaryTag(nextTokens, "Next.js Frontend")
        assertEquals("nextjs", nextTag)
    }

    @Test
    fun testGeographyDictionaryIntegrity_PreventsSubstringFalsePositives() {
        // Critical test: Mauritius must NEVER match "US"
        val mauritius = QueryAdapter.normalizeGeoTarget("Mauritius")
        assertNull("Mauritius must not match US", mauritius)

        // Critical test: Cyprus must NEVER match "US"
        val cyprus = QueryAdapter.normalizeGeoTarget("Cyprus")
        assertNull("Cyprus must not match US", cyprus)

        // Valid US matches
        val us = QueryAdapter.normalizeGeoTarget("United States")
        assertNotNull(us)
        assertEquals("US", us?.isoCode)
        assertEquals("usa", us?.jobicyGeo)

        val usa = QueryAdapter.normalizeGeoTarget("USA")
        assertNotNull(usa)
        assertEquals("US", usa?.isoCode)

        // Valid UK matches
        val uk = QueryAdapter.normalizeGeoTarget("United Kingdom")
        assertNotNull(uk)
        assertEquals("UK", uk?.isoCode)
        assertEquals("uk", uk?.jobicyGeo)

        // Valid Canada matches
        val canada = QueryAdapter.normalizeGeoTarget("Canada")
        assertNotNull(canada)
        assertEquals("CA", canada?.isoCode)
        assertEquals("canada", canada?.jobicyGeo)

        // Kenya & Africa
        val kenya = QueryAdapter.normalizeGeoTarget("Kenya")
        assertNotNull(kenya)
        assertEquals("KE", kenya?.isoCode)
        assertEquals("emea", kenya?.jobicyGeo)

        // Worldwide
        assertNull(QueryAdapter.normalizeGeoTarget("Worldwide"))
        assertNull(QueryAdapter.normalizeGeoTarget("Global"))
        assertNull(QueryAdapter.normalizeGeoTarget("Worldwide / Global"))
    }
}
