import { LeadMode, WebsiteStatusType } from "../types";
import { matchTextToTaxonomy } from "./index";

export interface ParsedSearchIntent {
  mode: LeadMode;
  extractedQuery: string;
  industryOrRole?: string;
  skills: Array<{ term: string; weight: number }>;
  isRemote: boolean;
  locationFilter?: string;
  country?: string;
  city?: string;
  websiteStatus?: WebsiteStatusType;
}

// Controlled skill expansion taxonomy with strict relevance weights
const SKILL_EXPANSION_TAXONOMY: Record<string, Array<{ term: string; weight: number }>> = {
  react: [
    { term: "React", weight: 1.0 },
    { term: "React.js", weight: 1.0 },
    { term: "ReactJS", weight: 1.0 },
    { term: "Next.js", weight: 0.85 },
    { term: "TypeScript", weight: 0.65 },
    { term: "JavaScript", weight: 0.50 },
  ],
  nextjs: [
    { term: "Next.js", weight: 1.0 },
    { term: "React", weight: 0.90 },
    { term: "TypeScript", weight: 0.70 },
    { term: "Node.js", weight: 0.60 },
  ],
  python: [
    { term: "Python", weight: 1.0 },
    { term: "Django", weight: 0.80 },
    { term: "FastAPI", weight: 0.80 },
    { term: "Flask", weight: 0.70 },
    { term: "SQL", weight: 0.50 },
  ],
  node: [
    { term: "Node.js", weight: 1.0 },
    { term: "Express", weight: 0.80 },
    { term: "TypeScript", weight: 0.75 },
    { term: "NestJS", weight: 0.70 },
    { term: "REST API", weight: 0.60 },
  ],
  devops: [
    { term: "DevOps", weight: 1.0 },
    { term: "AWS", weight: 0.85 },
    { term: "Docker", weight: 0.80 },
    { term: "Kubernetes", weight: 0.80 },
    { term: "CI/CD", weight: 0.75 },
    { term: "Terraform", weight: 0.70 },
  ],
  design: [
    { term: "UI/UX", weight: 1.0 },
    { term: "Product Designer", weight: 0.90 },
    { term: "Figma", weight: 0.85 },
    { term: "Design System", weight: 0.75 },
  ],
  ai: [
    { term: "AI Training", weight: 1.0 },
    { term: "Generative AI Evaluation", weight: 0.90 },
    { term: "Human Feedback", weight: 0.85 },
    { term: "Data Annotation", weight: 0.80 },
    { term: "Prompt Engineering", weight: 0.75 },
    { term: "Machine Learning", weight: 0.70 },
  ],
  annotation: [
    { term: "Data Annotation", weight: 1.0 },
    { term: "Computer Vision", weight: 0.90 },
    { term: "Image Labeling", weight: 0.85 },
    { term: "Data Collection", weight: 0.80 },
    { term: "LiDAR Annotation", weight: 0.75 },
  ],
  labeling: [
    { term: "Data Annotation", weight: 1.0 },
    { term: "Image Labeling", weight: 0.90 },
    { term: "Computer Vision", weight: 0.85 },
    { term: "Data Collection", weight: 0.80 },
  ],
  rlhf: [
    { term: "RLHF", weight: 1.0 },
    { term: "AI Training", weight: 0.95 },
    { term: "Human Feedback for AI", weight: 0.90 },
    { term: "Model Quality Evaluation", weight: 0.85 },
  ],
  rater: [
    { term: "Search Evaluation", weight: 1.0 },
    { term: "Search Quality Rater", weight: 0.95 },
    { term: "Search Relevance Rating", weight: 0.90 },
    { term: "Internet Assessor", weight: 0.80 },
  ],
  speech: [
    { term: "Language and Speech Tasks", weight: 1.0 },
    { term: "Data Collection", weight: 0.90 },
    { term: "Voice Recording", weight: 0.85 },
    { term: "Transcription", weight: 0.80 },
  ],
  coding: [
    { term: "AI Coding Tasks", weight: 1.0 },
    { term: "Code Evaluation", weight: 0.90 },
    { term: "Programming Benchmarks", weight: 0.85 },
    { term: "Expert AI Training", weight: 0.80 },
  ],
};

/**
 * Expands a search query into weighted terms based on controlled taxonomy.
 * Avoids uncontrolled semantic drift.
 */
export function expandQueryTerms(rawQuery: string): Array<{ term: string; weight: number }> {
  const q = rawQuery.toLowerCase().trim();
  const tokens = q.split(/[\s,+/]+/).filter(t => t.length > 1);
  const expansions: Array<{ term: string; weight: number }> = [{ term: rawQuery, weight: 1.0 }];

  for (const tok of tokens) {
    if (SKILL_EXPANSION_TAXONOMY[tok]) {
      expansions.push(...SKILL_EXPANSION_TAXONOMY[tok]);
    }
  }

  // Deduplicate by term keeping highest weight
  const map = new Map<string, number>();
  for (const item of expansions) {
    const key = item.term.toLowerCase();
    const current = map.get(key) || 0;
    if (item.weight > current) {
      map.set(key, item.weight);
    }
  }

  return Array.from(map.entries()).map(([term, weight]) => ({
    term,
    weight,
  }));
}

/**
 * Parses free-text natural-language search intent into structured search parameters.
 */
export function parseSearchIntent(input: string, fallbackMode: LeadMode = "online"): ParsedSearchIntent {
  const text = input.trim();
  const lower = text.toLowerCase();

  // Mode detection
  const isPhysicalHint = 
    lower.includes("without website") ||
    lower.includes("no website") ||
    lower.includes("businesses in") ||
    lower.includes("shops in") ||
    lower.includes("restaurants in") ||
    lower.includes("plumbers in") ||
    lower.includes("repair in");

  const mode: LeadMode = isPhysicalHint ? "physical" : fallbackMode;

  // Remote check
  const isRemote = lower.includes("remote") || lower.includes("work from anywhere") || mode === "online";

  // Location extraction
  let country: string | undefined = undefined;
  let city: string | undefined = undefined;

  if (lower.includes("kenya")) country = "Kenya";
  else if (lower.includes("united states") || lower.includes("usa") || lower.includes("us")) country = "United States";
  else if (lower.includes("united kingdom") || lower.includes("uk")) country = "United Kingdom";

  if (lower.includes("nairobi")) {
    city = "Nairobi";
    country = "Kenya";
  } else if (lower.includes("mombasa")) {
    city = "Mombasa";
    country = "Kenya";
  } else if (lower.includes("kisumu")) {
    city = "Kisumu";
    country = "Kenya";
  } else if (lower.includes("austin")) {
    city = "Austin";
    country = "United States";
  } else if (lower.includes("london")) {
    city = "London";
    country = "United Kingdom";
  }

  // Website status detection
  let websiteStatus: WebsiteStatusType | undefined = undefined;
  if (lower.includes("without website") || lower.includes("no website")) {
    websiteStatus = "NO_WEBSITE";
  }

  // Clean extracted query
  let cleanQuery = text
    .replace(/\b(remote|jobs|job|work|businesses|business|in|without website|no website|i can do from)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanQuery) cleanQuery = text;

  const matchedTaxonomy = matchTextToTaxonomy(cleanQuery, mode);
  const skills = expandQueryTerms(cleanQuery);

  return {
    mode,
    extractedQuery: cleanQuery,
    industryOrRole: matchedTaxonomy?.name || cleanQuery,
    skills,
    isRemote,
    country,
    city,
    websiteStatus,
  };
}
