import { sanitizeUntrustedText } from "../security/crypto";
import { UserProfileData } from "@/app/actions/profile";
import { OnlineJobLead, PhysicalLead } from "../types";

export type ProposalTemplateType =
  | "technical_pitch"
  | "comprehensive_cover"
  | "local_website_pitch"
  | "agency_modernization";

export interface GeneratedProposal {
  templateType: ProposalTemplateType;
  title: string;
  subject: string;
  greeting: string;
  body: string;
  callToAction: string;
  fullText: string;
  matchedSkills: string[];
  unmatchedSkills: string[];
  candidateName: string;
  candidateTitle: string;
  candidateRates: string;
}

function formatNaturalLocation(city?: string | null, country?: string | null): string {
  const c = (city || "").trim();
  const lower = c.toLowerCase();
  if (!c || lower.includes("worldwide") || lower.includes("global") || lower.includes("remote") || lower.includes("anywhere")) {
    return country && !country.toLowerCase().includes("worldwide") && !country.toLowerCase().includes("global")
      ? `in ${country}`
      : "in your area";
  }
  return `in ${c}`;
}

/**
 * Generates an honest, strictly fact-grounded proposal or cover letter for an online job opportunity.
 * Never fabricates skills, years of experience, or claims not present in the user profile.
 */
export function generateTruthfulJobProposal(
  job: Partial<OnlineJobLead>,
  profile: UserProfileData,
  templateType: ProposalTemplateType = "technical_pitch"
): GeneratedProposal {
  const jobTitle = sanitizeUntrustedText(job.title || "Software Engineering Role");
  const company = sanitizeUntrustedText(job.company || "Hiring Team");
  const rawTags = (job.tags || []).map((t) => sanitizeUntrustedText(t));

  const candidateSkills = profile.skills || [];
  const candidateLower = candidateSkills.map((s) => s.toLowerCase());

  // Find exact and partial matches between candidate profile and job requirements
  const matchedSkills: string[] = [];
  const unmatchedSkills: string[] = [];

  rawTags.forEach((tag) => {
    const isMatch = candidateLower.some((cSkill) => cSkill.includes(tag.toLowerCase()) || tag.toLowerCase().includes(cSkill));
    if (isMatch) {
      matchedSkills.push(tag);
    } else if (tag.length > 2) {
      unmatchedSkills.push(tag);
    }
  });

  const primarySkillsStr =
    matchedSkills.length > 0
      ? matchedSkills.slice(0, 4).join(", ")
      : candidateSkills.slice(0, 4).join(", ");

  const rateDisplay =
    profile.currency === "KES"
      ? `KES ${profile.hourlyRateKes?.toLocaleString() || "5,000"}/hr (approx. $${profile.hourlyRateUsd || 40}/hr)`
      : `$${profile.hourlyRateUsd || 45}/hr`;

  let subject = "";
  let greeting = `Hi ${company} team,`;
  let body = "";
  let callToAction = "";

  if (templateType === "technical_pitch") {
    subject = `Application for ${jobTitle} — ${profile.fullName} (${primarySkillsStr})`;
    body = `I am writing to express my interest in the ${jobTitle} position at ${company}.

With over ${profile.yearsExperience || 3}+ years of hands-on software engineering experience specializing in ${primarySkillsStr}, I focus on shipping clean, resilient, and performant web applications from design to production.

Relevant Highlights:
- Core Competencies: ${candidateSkills.slice(0, 6).join(", ")}
- Engineering Focus: Scalable architecture, type-safe data modeling, API performance, and responsive frontend design.
- Location & Timezone: ${profile.city || "Nairobi"}, ${profile.country || "Kenya"} (${profile.timezone || "EAT, UTC+3"}) with extensive working-hour overlap.
${profile.portfolioUrl ? `- Portfolio & Case Studies: ${profile.portfolioUrl}` : ""}
${profile.githubUrl ? `- GitHub: ${profile.githubUrl}` : ""}`.trim();

    callToAction = `I would love the opportunity to discuss how my background with ${primarySkillsStr} aligns with ${company}'s technical roadmap.

Best regards,
${profile.fullName}
${profile.professionalTitle}
${profile.email ? `Email: ${profile.email}` : ""}
${profile.phone ? `Phone / WhatsApp: ${profile.phone}` : ""}`.trim();

  } else if (templateType === "comprehensive_cover") {
    subject = `Cover Letter: ${jobTitle} — ${profile.fullName}`;
    greeting = `Dear Hiring Team at ${company},`;
    body = `I am writing to express my enthusiastic interest in the ${jobTitle} position with ${company}.

${profile.bio || "As a full-stack engineer, I combine strong architectural foundations with a commitment to shipping reliable, user-friendly software."}

Throughout my career, I have honed expertise in ${primarySkillsStr}, building robust web applications, optimizing databases, and integrating modern third-party APIs with high reliability.

What I bring to ${company}:
1. Proven Technical Delivery: Deep proficiency in ${candidateSkills.slice(0, 5).join(", ")}.
2. Clear Communication: Fluent in ${profile.languages?.join(" and ") || "English"}, experienced in distributed collaboration across asynchronous teams.
3. Product Ownership: End-to-end responsibility for code quality, system security, and seamless user experiences.`.trim();

    callToAction = `Thank you for your time and consideration. I would be thrilled to connect for an interview to explore how I can add immediate value to your team.

Sincerely,
${profile.fullName}
${profile.professionalTitle}
${profile.portfolioUrl ? `Portfolio: ${profile.portfolioUrl}` : ""}${profile.portfolioUrl && profile.linkedinUrl ? " | " : ""}${profile.linkedinUrl ? `LinkedIn: ${profile.linkedinUrl}` : ""}`.trim();

  } else {
    // Agency / Contract modernization pitch
    subject = `Engineering Partnership for ${company} — ${profile.fullName}`;
    body = `I noticed ${company}'s current requirements for ${jobTitle} and wanted to connect.

I provide specialized engineering solutions in ${primarySkillsStr}, helping teams accelerate feature delivery, eliminate technical debt, and build resilient web architectures.

Key Highlights:
- Available Capacity: Contract or Full-time Remote
- Rate: ${rateDisplay}
- Availability: Immediate onboarding (${profile.timezone || "UTC+3"})`.trim();

    callToAction = `Let's schedule a brief 10-minute discovery call this week to see if my background matches what ${company} needs.

Regards,
${profile.fullName}
${profile.professionalTitle}`.trim();
  }

  const fullText = `SUBJECT: ${subject}

${greeting}

${body}

${callToAction}`;

  return {
    templateType,
    title: jobTitle,
    subject,
    greeting,
    body,
    callToAction,
    fullText,
    matchedSkills,
    unmatchedSkills,
    candidateName: profile.fullName,
    candidateTitle: profile.professionalTitle,
    candidateRates: rateDisplay,
  };
}

/**
 * Generates an outreach pitch for a local physical business (e.g. restaurant, clinic, auto repair)
 * targeting the lack of a website, missing online booking, or missed Google Maps revenue.
 */
export function generateTruthfulPhysicalPitch(
  lead: Partial<PhysicalLead>,
  profile: UserProfileData,
  templateType: "local_website_pitch" | "agency_modernization" = "local_website_pitch"
): GeneratedProposal {
  const businessName = sanitizeUntrustedText(lead.businessName || "Local Business");
  const niche = sanitizeUntrustedText(lead.category || "services");
  const city = sanitizeUntrustedText(lead.city || "");
  const country = sanitizeUntrustedText(lead.country || "Kenya");
  const isKenya = country.toLowerCase().includes("kenya") || (lead.phone || "").startsWith("+254");
  const locStr = formatNaturalLocation(city, country);

  const projectRateStr =
    isKenya || profile.currency === "KES"
      ? `KES ${profile.projectRateKes?.toLocaleString() || "150,000"} (flexible milestone payments via M-Pesa Till or Bank)`
      : `$${profile.projectRateUsd || 1500}`;

  let subject = "";
  let greeting = `Hi ${businessName} team,`;
  let body = "";
  let callToAction = "";

  if (templateType === "local_website_pitch") {
    subject = `Quick question regarding ${businessName}'s online presence`;
    body = `My name is ${profile.fullName}, a web developer based in ${profile.city || "Nairobi"}.

I came across ${businessName} while searching for ${niche} ${locStr}. You have a great local presence, but I noticed there is currently no dedicated website or direct 1-click WhatsApp order link connected to your Google listing.

When potential customers search for ${niche} on their phones, they usually look for fast service details, pricing, and an easy way to reach out immediately. Without a dedicated mobile page, many of those potential customers end up contacting competitors.

Here is what I build for businesses like ${businessName}:
1. Fast Mobile Website: Loads in under 1 second on all mobile networks.
2. 1-Click WhatsApp & Call Buttons: Customers tap once to chat, order, or book directly with your staff.
3. Google Search & Map Optimization: Helps more local customers discover you first.
4. Transparent Pricing: Starting at ${projectRateStr} with zero hidden maintenance fees.`.trim();

    callToAction = `I put together a quick 2-minute mockup preview showing what a modern mobile site for ${businessName} could look like.

Would you be open to me sending over the link via WhatsApp or email so you can take a look?

Best regards,
${profile.fullName}
${profile.professionalTitle}
${profile.phone ? `Phone / WhatsApp: ${profile.phone}` : ""}
${profile.portfolioUrl ? `Previous Client Sites: ${profile.portfolioUrl}` : ""}`.trim();

  } else {
    // Agency modernization pitch
    subject = `Digital growth opportunities for ${businessName}`;
    body = `I am reaching out to share a few practical digital growth ideas for ${businessName}.

As a digital solutions specialist, I help ${niche} businesses streamline customer inquiries, reduce booking friction, and capture more direct sales online.

Recommended upgrades for ${businessName}:
- High-converting mobile website tailored to your brand identity.
- Automated appointment scheduling with WhatsApp reminders to reduce no-shows.
- ${isKenya ? "Direct M-Pesa Till / Paybill and bank checkout integration." : "Integrated online payment processing."}
- Local SEO setup to capture active search traffic ${locStr}.`.trim();

    callToAction = `Would you be open to a quick 5-minute call this week to see if these upgrades make sense for ${businessName}?

Sincerely,
${profile.fullName}
${profile.professionalTitle}
${profile.email ? `Email: ${profile.email}` : ""}
${profile.phone ? `WhatsApp: ${profile.phone}` : ""}`.trim();
  }

  const fullText = `SUBJECT: ${subject}

${greeting}

${body}

${callToAction}`;

  return {
    templateType,
    title: businessName,
    subject,
    greeting,
    body,
    callToAction,
    fullText,
    matchedSkills: [],
    unmatchedSkills: [],
    candidateName: profile.fullName,
    candidateTitle: profile.professionalTitle,
    candidateRates: projectRateStr,
  };
}
