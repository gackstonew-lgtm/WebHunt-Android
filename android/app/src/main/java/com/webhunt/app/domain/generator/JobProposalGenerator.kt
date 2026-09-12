package com.webhunt.app.domain.generator

import com.webhunt.app.data.model.OnlineJobLead
import com.webhunt.app.data.model.UserProfileData

data class GeneratedJobProposal(
    val subject: String,
    val greeting: String,
    val body: String,
    val callToAction: String,
    val fullText: String,
    val matchedSkills: List<String>
)

object JobProposalGenerator {

    fun generate(
        job: OnlineJobLead,
        profile: UserProfileData,
        templateType: String = "technical_pitch"
    ): GeneratedJobProposal {
        val jobTitle = job.title.ifBlank { "Software Engineering Role" }
        val company = job.company.ifBlank { "Hiring Team" }
        val rawTags = job.tags

        val candidateSkills = profile.skills.ifEmpty {
            listOf("Next.js", "React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS", "REST APIs")
        }
        val candidateLower = candidateSkills.map { it.lowercase() }

        val matched = rawTags.filter { tag ->
            candidateLower.any { it.contains(tag.lowercase()) || tag.lowercase().contains(it) }
        }

        val subject = "Application for $jobTitle - ${profile.fullName}"
        val greeting = "Hi $company Team,"

        val primarySkillsText = if (matched.isNotEmpty()) {
            "My primary stack directly aligns with your requirements, particularly in ${matched.joinToString(", ")}."
        } else {
            "With expertise in ${candidateSkills.take(4).joinToString(", ")}, I have built production applications with similar architecture."
        }

        val body = """
I am writing to express my strong interest in the $jobTitle position at $company.

As a ${profile.professionalTitle} with ${profile.yearsExperience ?: 4}+ years of hands-on experience, I specialize in engineering responsive, reliable, and high-performance applications.

$primarySkillsText

Key strengths I bring to $company:
- Production-Ready Clean Architecture: Strict adherence to maintainable code, rigorous unit testing, and robust error handling.
- Scalable Performance: Experience optimizing load times, state management, and backend query efficiency.
- Clear Communication & Autonomous Execution: Comfortable collaborating across distributed time zones with proactive updates.
        """.trimIndent()

        val callToAction = """
I have linked my portfolio and relevant code repositories below:
${if (!profile.portfolioUrl.isNullOrBlank()) "Portfolio: ${profile.portfolioUrl}" else ""}
${if (!profile.githubUrl.isNullOrBlank()) "GitHub: ${profile.githubUrl}" else ""}
${if (!profile.linkedinUrl.isNullOrBlank()) "LinkedIn: ${profile.linkedinUrl}" else ""}

I would welcome the opportunity to discuss how my background can support your product goals.

Best regards,
${profile.fullName}
${profile.email ?: ""}
${profile.phone ?: ""}
        """.trimIndent()

        val fullText = """
JOB PROPOSAL / COVER LETTER FOR $company
Role: $jobTitle
Source: ${job.source} (${job.location})

SUBJECT: $subject

$greeting

$body

$callToAction
        """.trimIndent()

        return GeneratedJobProposal(
            subject = subject,
            greeting = greeting,
            body = body,
            callToAction = callToAction,
            fullText = fullText,
            matchedSkills = matched
        )
    }
}
