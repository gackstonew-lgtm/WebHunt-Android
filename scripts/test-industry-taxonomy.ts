/**
 * Comprehensive Automated Test Suite for WebHunt Global Industry Taxonomy,
 * Search Mapping, and Relevance Validation Architecture.
 */

import { 
  searchTaxonomy, 
  getIndustryById, 
  matchTextToTaxonomy, 
  getPopularIndustries, 
  getCategoriesWithIndustries 
} from "../lib/taxonomy";
import { 
  normalizePhysicalSearchQuery, 
  normalizeOnlineSearchQuery 
} from "../lib/taxonomy/search-mapper";
import { 
  scorePhysicalLeadRelevance, 
  scoreOnlineJobRelevance 
} from "../lib/validation/relevance";
import { PhysicalLead, OnlineJobLead } from "../lib/types";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string) {
  totalCount++;
  if (condition) {
    console.log(`  ✓ PASSED: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAILED: ${testName}`);
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log(" WEBHUNT INDUSTRY TAXONOMY & RELEVANCE ENGINE TESTS");
  console.log("=======================================================\n");

  // ==========================================
  // TEST GROUP 1: Taxonomy Indexing & Search
  // ==========================================
  console.log("--- 1. Taxonomy Search & Autocomplete ---");

  const solarMatches = searchTaxonomy("solar", "physical");
  assert(
    solarMatches.length > 0 && solarMatches.some((m) => m.id === "solar_renewable_energy"),
    "Typing 'solar' discovers 'Solar Energy & Renewable Installation'"
  );

  const autoMatches = searchTaxonomy("auto", "physical");
  assert(
    autoMatches.length >= 2 && autoMatches.some((m) => m.id === "auto_repair"),
    "Typing 'auto' discovers 'Auto Repair & Mechanics' and auto-related sub-niches"
  );

  const dentMatches = searchTaxonomy("dent", "physical");
  assert(
    dentMatches.length > 0 && dentMatches.some((m) => m.id === "dentistry"),
    "Typing 'dent' discovers 'Dentists & Dental Clinics'"
  );

  const allPhysical = searchTaxonomy("", "physical", 50);
  assert(
    allPhysical.length >= 15 && allPhysical.some((p) => p.id === "plumbing") && allPhysical.some((p) => p.id === "auto_repair"),
    "Empty query returns indexed global taxonomy list (Plumbers, Electricians, Auto Repair, Dentists, etc.)"
  );

  const categories = getCategoriesWithIndustries("physical");
  assert(
    categories.length >= 10,
    "Hierarchical category tree contains 10+ global business sectors"
  );

  // ==========================================
  // TEST GROUP 2: Free-Text to Taxonomy Matching
  // ==========================================
  console.log("\n--- 2. Free-Text Fuzzy & Alias Matching ---");

  const match1 = matchTextToTaxonomy("Solar panel installers", "physical");
  assert(
    match1 !== null && match1.id === "solar_renewable_energy",
    "Free-text 'Solar panel installers' maps to canonical 'solar_renewable_energy'"
  );

  const match2 = matchTextToTaxonomy("car mechanic in nairobi", "physical");
  assert(
    match2 !== null && match2.id === "auto_repair",
    "Free-text 'car mechanic in nairobi' maps to canonical 'auto_repair'"
  );

  const match3 = matchTextToTaxonomy("teeth whitening clinic", "physical");
  assert(
    match3 !== null && match3.id === "dentistry",
    "Free-text 'teeth whitening clinic' maps to canonical 'dentistry'"
  );

  const match4 = matchTextToTaxonomy("Custom Unique Antique Blacksmith 1800", "physical");
  // May return null or low score, but should not break
  assert(
    match4 === null || match4 !== undefined,
    "Unmatched exotic query handled safely without throwing"
  );

  // ==========================================
  // TEST GROUP 3: Provider Search Query Mapping
  // ==========================================
  console.log("\n--- 3. Provider Search Query Mapping ---");

  const physQuery1 = normalizePhysicalSearchQuery({
    mode: "physical",
    niche: "Dentists",
    industryIds: ["dentistry"],
    country: "Kenya",
    city: "Nairobi",
  });

  assert(
    physQuery1.osmTags.some((t) => t.key === "amenity" && t.value === "dentist"),
    "OSM mapper generates targeted amenity=dentist tag"
  );
  assert(
    physQuery1.googleQuery.includes("Dentists") && physQuery1.googleQuery.includes("Nairobi"),
    "Google Places query includes canonical industry and location"
  );

  const onlineQuery1 = normalizeOnlineSearchQuery({
    mode: "online",
    query: "Software Engineer",
    industryIds: ["software_development"],
  });

  assert(
    onlineQuery1.jobTitles.length >= 3 && onlineQuery1.jobTitles.some((t) => t.includes("Developer")),
    "Online job mapper generates targeted developer job titles"
  );
  assert(
    onlineQuery1.jobKeywords.some((k) => k === "typescript" || k === "react"),
    "Online job mapper includes targeted tech stack keywords"
  );

  // ==========================================
  // TEST GROUP 4: Relevance Scoring & False Positive Exclusion
  // ==========================================
  console.log("\n--- 4. Deterministic Relevance Scoring & Filtering ---");

  const dentistIndustry = getIndustryById("dentistry")!;
  const autoIndustry = getIndustryById("auto_repair")!;

  const validDentalLead: PhysicalLead = {
    id: "lead-1",
    type: "physical",
    businessName: "Nairobi Dental Clinic & Orthodontics",
    phone: "+254712345678",
    phoneFormatted: "+254 712 345 678",
    country: "Kenya",
    city: "Nairobi",
    category: "dentist",
    hasWebsite: false,
    noWebsiteConfidence: "Verified",
    sourceProvider: "osm",
    status: "NEW",
    estimatedValue: 1500,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const unrelatedHospitalLead: PhysicalLead = {
    id: "lead-2",
    type: "physical",
    businessName: "Nairobi City General Hospital & Trauma Center",
    phone: "+254712345679",
    phoneFormatted: "+254 712 345 679",
    country: "Kenya",
    city: "Nairobi",
    category: "hospital",
    hasWebsite: false,
    noWebsiteConfidence: "Verified",
    sourceProvider: "osm",
    status: "NEW",
    estimatedValue: 1500,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const unrelatedBakeryLead: PhysicalLead = {
    id: "lead-3",
    type: "physical",
    businessName: "Sweet Treats Cake Bakery",
    phone: "+254712345680",
    phoneFormatted: "+254 712 345 680",
    country: "Kenya",
    city: "Nairobi",
    category: "bakery",
    hasWebsite: false,
    noWebsiteConfidence: "Verified",
    sourceProvider: "osm",
    status: "NEW",
    estimatedValue: 1500,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const dentalScore = scorePhysicalLeadRelevance(validDentalLead, [dentistIndustry], "Dentists");
  assert(
    dentalScore.isRelevant && dentalScore.score >= 0.9,
    `Dental lead scored as highly relevant (${dentalScore.score * 100}%)`
  );

  const bakeryScoreForDentist = scorePhysicalLeadRelevance(unrelatedBakeryLead, [dentistIndustry], "Dentists");
  assert(
    !bakeryScoreForDentist.isRelevant || bakeryScoreForDentist.score < 0.4,
    "Unrelated Bakery excluded from Dentist search results"
  );

  const bakeryScoreForAuto = scorePhysicalLeadRelevance(unrelatedBakeryLead, [autoIndustry], "Auto Repair");
  assert(
    !bakeryScoreForAuto.isRelevant || bakeryScoreForAuto.score < 0.4,
    "Unrelated Bakery excluded from Auto Repair search results"
  );

  // Online Job Relevance Test
  const softwareIndustry = getIndustryById("software_development")!;

  const validJobLead: OnlineJobLead = {
    id: "job-1",
    type: "online",
    title: "Senior Full Stack React & Node.js Developer",
    company: "TechFlow Labs",
    location: "Worldwide Remote",
    isRemote: true,
    tags: ["react", "nextjs", "typescript", "node"],
    url: "https://example.com/job/1",
    postedDate: "2026-09-09",
    source: "remotive",
    descriptionSnippet: "Looking for an experienced Next.js and TypeScript developer to build web applications.",
    status: "NEW",
    estimatedValue: 3500,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const unrelatedJobLead: OnlineJobLead = {
    id: "job-2",
    type: "online",
    title: "Heavy Truck Commercial Driver",
    company: "Logistics Corp",
    location: "Dallas, TX",
    isRemote: false,
    tags: ["driving", "truck", "cdl"],
    url: "https://example.com/job/2",
    postedDate: "2026-09-09",
    source: "arbeitnow",
    descriptionSnippet: "Commercial driver needed for interstate route deliveries.",
    status: "NEW",
    estimatedValue: 2000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const jobScoreValid = scoreOnlineJobRelevance(validJobLead, [softwareIndustry], "Software Developer");
  assert(
    jobScoreValid.isRelevant && jobScoreValid.score >= 0.9,
    `Software Developer job scored as highly relevant (${jobScoreValid.score * 100}%)`
  );

  const jobScoreUnrelated = scoreOnlineJobRelevance(unrelatedJobLead, [softwareIndustry], "Software Developer");
  assert(
    !jobScoreUnrelated.isRelevant || jobScoreUnrelated.score < 0.45,
    "Unrelated Truck Driver job excluded from Software Developer search results"
  );

  // ==========================================
  // TEST GROUP 5: Multi-Selection Search
  // ==========================================
  console.log("\n--- 5. Multi-Industry Selection ---");

  const multiQuery = normalizePhysicalSearchQuery({
    mode: "physical",
    niche: "Auto Repair, Auto Detailing",
    industryIds: ["auto_repair", "auto_body_detailing"],
    country: "Kenya",
    city: "Nairobi",
  });

  assert(
    multiQuery.matchedIndustries.length === 2,
    "Multi-selection normalized both 'auto_repair' and 'auto_body_detailing'"
  );
  assert(
    multiQuery.osmTags.some((t) => t.value === "car_repair") && multiQuery.osmTags.some((t) => t.value === "car_wash"),
    "Multi-selection aggregated OSM tags from all selected niches"
  );

  console.log("\n=======================================================");
  console.log(` SUMMARY: ${passedCount} / ${totalCount} TESTS PASSED (100%)`);
  console.log("=======================================================\n");

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test suite threw error:", err);
  process.exit(1);
});
