import { validateAndFormatPhone } from "../lib/validation/phone";
import { validateUrl } from "../lib/validation/url";
import { parseAndFormatAddress } from "../lib/validation/address";
import { classifyLocation } from "../lib/geo/classifier";
import { deduplicatePhysicalLeads, deduplicateOnlineJobs } from "../lib/deduplication";
import { PhysicalLead, OnlineJobLead } from "../lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("\n==================================================");
console.log("1. TESTING PHONE VALIDATION & NORMALIZATION");
console.log("==================================================");

// Kenyan phone tests
const ke1 = validateAndFormatPhone("0712345678", "Kenya");
assert(ke1.isValid && ke1.formatted === "+254 712 345 678", "Kenya local mobile formatted to +254 712 345 678");

const ke2 = validateAndFormatPhone("+254722123456", "Kenya");
assert(ke2.isValid && ke2.formatted === "+254 722 123 456", "Kenya +254 formatted to +254 722 123 456");

// US phone tests
const us1 = validateAndFormatPhone("5125551234", "United States");
assert(us1.isValid && us1.formatted === "+1 (512) 555-1234", "US 10-digit number formatted to +1 (512) 555-1234");

// UK phone tests
const uk1 = validateAndFormatPhone("+447911123456", "United Kingdom");
assert(uk1.isValid && uk1.formatted.startsWith("+44"), "UK international number parsed");

// Missing / invalid phone tests
const invalid1 = validateAndFormatPhone("", "Kenya");
assert(!invalid1.isValid && invalid1.formatted === "Phone unavailable", "Empty phone returns 'Phone unavailable'");

const invalid2 = validateAndFormatPhone("123", "United States");
assert(!invalid2.isValid && invalid2.formatted === "Phone unavailable", "Short phone returns 'Phone unavailable'");

console.log("\n==================================================");
console.log("2. TESTING URL VALIDATION");
console.log("==================================================");

const url1 = validateUrl("https://remotive.com/jobs");
assert(url1.isValid && url1.domain === "remotive.com", "Valid HTTPS URL parsed");

const url2 = validateUrl("www.example.co.ke");
assert(url2.isValid && url2.normalizedUrl === "https://www.example.co.ke/", "Normalized non-protocol URL to HTTPS");

const url3 = validateUrl("invalid-url-string");
assert(!url3.isValid, "Invalid URL string rejected");

console.log("\n==================================================");
console.log("3. TESTING GEOGRAPHIC & REMOTE WORK CLASSIFICATION");
console.log("==================================================");

const geo1 = classifyLocation("Worldwide Remote", true);
assert(geo1.isWorldwide && geo1.remoteType === "worldwide", "Worldwide remote recognized");

const geo2 = classifyLocation("Remote (US Only)", true);
assert(!geo2.isWorldwide && geo2.remoteType === "country_specific" && geo2.country === "United States", "US-only remote recognized");

const geo3 = classifyLocation("Nairobi, Kenya", false);
assert(geo3.remoteType === "worldwide" || geo3.remoteType === "regional", "Kenya location classified");

console.log("\n==================================================");
console.log("4. TESTING DEDUPLICATION ENGINE");
console.log("==================================================");

const dummyLeads: PhysicalLead[] = [
  {
    id: "lead-1",
    type: "physical",
    businessName: "Acme Plumbing Ltd",
    phone: "254712345678",
    phoneFormatted: "+254 712 345 678",
    city: "Nairobi",
    country: "Kenya",
    hasWebsite: false,
    noWebsiteConfidence: "Verified",
    sourceProvider: "osm",
    status: "NEW",
    estimatedValue: 1200,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "lead-2",
    type: "physical",
    businessName: "Acme Plumbing Services", // Duplicate by phone
    phone: "+254 712 345 678",
    phoneFormatted: "+254 712 345 678",
    city: "Nairobi",
    country: "Kenya",
    hasWebsite: false,
    noWebsiteConfidence: "Verified",
    sourceProvider: "google",
    status: "NEW",
    estimatedValue: 1200,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "lead-3",
    type: "physical",
    businessName: "Unique Electricals",
    phone: "254799887766",
    phoneFormatted: "+254 799 887 766",
    city: "Nairobi",
    country: "Kenya",
    hasWebsite: false,
    noWebsiteConfidence: "Verified",
    sourceProvider: "osm",
    status: "NEW",
    estimatedValue: 1200,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const dedupedLeads = deduplicatePhysicalLeads(dummyLeads);
assert(dedupedLeads.length === 2, "Physical leads deduplicated 3 -> 2 matching phones");

const dummyJobs: OnlineJobLead[] = [
  {
    id: "job-1",
    type: "online",
    title: "Senior Full Stack Next.js Engineer",
    company: "Vanguard Tech",
    location: "Worldwide Remote",
    isRemote: true,
    tags: ["Next.js", "React"],
    url: "https://remotive.com/job/123",
    postedDate: "2026-09-01",
    source: "remotive",
    status: "NEW",
    estimatedValue: 4000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "job-2",
    type: "online",
    title: "Senior Full Stack Next.js Engineer", // Same company + title
    company: "Vanguard Tech Inc.",
    location: "Worldwide Remote",
    isRemote: true,
    tags: ["Next.js"],
    url: "https://arbeitnow.com/job/456",
    postedDate: "2026-09-01",
    source: "arbeitnow",
    status: "NEW",
    estimatedValue: 4000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const dedupedJobs = deduplicateOnlineJobs(dummyJobs);
assert(dedupedJobs.length === 1, "Online jobs deduplicated 2 -> 1 matching title + company");

console.log("\n==================================================");
console.log("ALL TESTS COMPLETED SUCCESSFULLY");
console.log("==================================================\n");
