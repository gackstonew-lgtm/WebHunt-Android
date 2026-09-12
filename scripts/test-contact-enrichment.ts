/**
 * Production Contact Enrichment & Data Architecture Test Suite
 * Run with: npx tsx scripts/test-contact-enrichment.ts
 */

import { isValidBusinessEmail, normalizeEmail, extractEmailsFromText } from "../lib/enrichment/email";
import { normalizePhoneNumber, extractPhonesFromText, deduplicateContacts } from "../lib/enrichment/phone";
import { extractWhatsAppFromLinksAndTags } from "../lib/enrichment/whatsapp";
import { normalizeSocialUrl, extractSocialsFromLinks } from "../lib/enrichment/social";
import { classifyActionLinks, detectContactForm } from "../lib/enrichment/links";
import { extractStructuredData } from "../lib/enrichment/structured-data";
import { enrichLeadContacts } from "../lib/enrichment";
import { PhysicalLead } from "../lib/types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log(" WEBHUNT LEAD CONTACT ENRICHMENT TEST SUITE");
  console.log("=======================================================\n");

  // -------------------------------------------------------------
  // 1. Email Extraction & Technical Validation
  // -------------------------------------------------------------
  console.log("--- 1. Email Extraction & Technical Validation ---");

  assert(isValidBusinessEmail("info@nairobidoc.com"), "Valid business email accepted");
  assert(isValidBusinessEmail("sales@plumbing-pros.co.ke"), "Hyphenated ccTLD business email accepted");
  assert(isValidBusinessEmail("support.tech@enterprise.org"), "Dotted business email accepted");

  // Rejection tests (Zero-fabrication and artifact protection)
  assert(!isValidBusinessEmail("icon@2x.png"), "Asset image extension (.png) rejected");
  assert(!isValidBusinessEmail("logo@3x.svg"), "Asset image extension (.svg) rejected");
  assert(!isValidBusinessEmail("user@example.com"), "Placeholder domain (example.com) rejected");
  assert(!isValidBusinessEmail("name@domain.com"), "Placeholder domain (domain.com) rejected");
  assert(!isValidBusinessEmail("sentry@sentry.io"), "Analytics framework domain (sentry.io) rejected");
  assert(!isValidBusinessEmail("yourname@business.com"), "Generic template local part (yourname) rejected");
  assert(!isValidBusinessEmail("invalid..email@domain"), "Malformed email rejected");

  const sampleHtml = `
    <html>
      <body>
        <p>Call us or email <a href="mailto:info@solarkenya.co.ke?subject=Inquiry">info@solarkenya.co.ke</a></p>
        <p>Sales: sales@solarkenya.co.ke | Duplicate: INFO@solarkenya.co.ke</p>
        <p>CDN asset: asset@2x.png (should be ignored)</p>
        <p>Framework: sentry@sentry.io (should be ignored)</p>
      </body>
    </html>
  `;
  const extractedEmails = extractEmailsFromText(sampleHtml);
  assert(extractedEmails.length === 2, `Extracted exactly 2 legitimate emails (got ${extractedEmails.length})`);
  assert(extractedEmails.some(e => e.value === "info@solarkenya.co.ke"), "Extracted mailto email");
  assert(extractedEmails.some(e => e.value === "sales@solarkenya.co.ke"), "Extracted body text email");

  // -------------------------------------------------------------
  // 2. Phone Normalization & Deduplication
  // -------------------------------------------------------------
  console.log("\n--- 2. Phone Normalization & Deduplication ---");

  const p1 = normalizePhoneNumber("+254 700 123 456", "Kenya");
  const p2 = normalizePhoneNumber("0700123456", "Kenya");
  const p3 = normalizePhoneNumber("tel:+254700123456", "Kenya");

  assert(p1.isValid && p1.normalized === "+254700123456", "E.164 normalization for Kenyan number with spaces");
  assert(p2.isValid && p2.normalized === "+254700123456", "Local Kenyan phone normalized to E.164");
  assert(p3.isValid && p3.normalized === "+254700123456", "tel: URI prefix stripped and normalized");

  const contactsToDedup = [
    { type: "phone" as const, value: "+254700123456", source: "provider_api" as const, verified: true },
    { type: "phone" as const, value: "+254700123456", source: "official_website" as const, verified: true },
    { type: "phone" as const, value: "+254711999888", source: "official_website" as const, verified: true },
  ];
  const deduped = deduplicateContacts(contactsToDedup);
  assert(deduped.length === 2, `Deduplicated redundant phone entries (expected 2, got ${deduped.length})`);

  // -------------------------------------------------------------
  // 3. WhatsApp Discovery & Strict Evidence Check
  // -------------------------------------------------------------
  console.log("\n--- 3. WhatsApp Discovery & Evidence Check ---");

  const waLinks = [
    "https://wa.me/254712345678",
    "https://api.whatsapp.com/send?phone=254722000111&text=Hello",
    "https://example.com/about",
  ];
  const waTags = ["+254733444555"];

  const waDiscovered = extractWhatsAppFromLinksAndTags(waLinks, waTags, "Kenya");
  assert(waDiscovered.length === 3, `Discovered 3 verified WhatsApp contacts (got ${waDiscovered.length})`);
  assert(waDiscovered[0].value === "https://wa.me/254712345678", "Direct wa.me URL formatted correctly");
  assert(waDiscovered[1].value === "https://wa.me/254722000111", "api.whatsapp.com parsed into wa.me link");
  assert(waDiscovered[2].value === "https://wa.me/254733444555", "OSM contact:whatsapp tag converted to wa.me link");

  // Verify non-WhatsApp phone is NOT inferred as WhatsApp
  const regularPhoneOnly = extractWhatsAppFromLinksAndTags(["https://example.com/contact"], []);
  assert(regularPhoneOnly.length === 0, "Ordinary phone / URL is NEVER inferred as WhatsApp");

  // -------------------------------------------------------------
  // 4. Social Media URL Normalization & Share-Filter
  // -------------------------------------------------------------
  console.log("\n--- 4. Social Media URL Normalization ---");

  const fbNorm = normalizeSocialUrl("https://www.facebook.com/nairobidocs/?ref=bookmarks&utm_source=test");
  const igNorm = normalizeSocialUrl("https://instagram.com/nairobidocs/");
  const liNorm = normalizeSocialUrl("https://linkedin.com/company/nairobidocs");
  const twNorm = normalizeSocialUrl("https://twitter.com/nairobidocs");
  const ytNorm = normalizeSocialUrl("https://youtube.com/@nairobidocs");
  const tkNorm = normalizeSocialUrl("https://tiktok.com/@nairobidocs");
  const tgNorm = normalizeSocialUrl("https://t.me/nairobidocs");

  assert(fbNorm?.canonicalUrl === "https://www.facebook.com/nairobidocs", "Facebook URL tracking parameters stripped");
  assert(igNorm?.canonicalUrl === "https://www.instagram.com/nairobidocs", "Instagram profile canonicalized");
  assert(liNorm?.canonicalUrl === "https://www.linkedin.com/company/nairobidocs", "LinkedIn company profile canonicalized");
  assert(twNorm?.canonicalUrl === "https://x.com/nairobidocs", "Twitter/X handle canonicalized");
  assert(ytNorm?.canonicalUrl === "https://www.youtube.com/@nairobidocs", "YouTube channel canonicalized");
  assert(tkNorm?.canonicalUrl === "https://www.tiktok.com/@nairobidocs", "TikTok profile canonicalized");
  assert(tgNorm?.canonicalUrl === "https://t.me/nairobidocs", "Telegram channel canonicalized");

  // Share widgets must be filtered out
  assert(normalizeSocialUrl("https://www.facebook.com/sharer/sharer.php?u=example") === null, "Facebook share widget ignored");
  assert(normalizeSocialUrl("https://twitter.com/intent/tweet?text=hello") === null, "Twitter tweet intent ignored");
  assert(normalizeSocialUrl("https://www.linkedin.com/shareArticle?mini=true") === null, "LinkedIn shareArticle dialog ignored");

  // -------------------------------------------------------------
  // 5. JSON-LD Schema.org Structured Data
  // -------------------------------------------------------------
  console.log("\n--- 5. JSON-LD Schema.org Structured Data ---");

  const sampleJsonLd = `
    <html>
      <head>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Nairobi Dental Practice",
            "telephone": "+254 700 888 999",
            "email": "dentist@nairobidoc.co.ke",
            "url": "https://nairobidoc.co.ke",
            "sameAs": [
              "https://www.facebook.com/nairobidental",
              "https://www.instagram.com/nairobidental"
            ]
          }
        </script>
      </head>
      <body><h1>Dental Clinic</h1></body>
    </html>
  `;
  const structured = extractStructuredData(sampleJsonLd, "https://nairobidoc.co.ke", "Kenya");
  assert(structured.phones.length === 1 && structured.phones[0].value === "+254700888999", "Schema.org telephone extracted");
  assert(structured.emails.length === 1 && structured.emails[0].value === "dentist@nairobidoc.co.ke", "Schema.org email extracted");
  assert(structured.socials.length === 2, "Schema.org sameAs social profiles extracted");

  // -------------------------------------------------------------
  // 6. Action Links & Contact Form Detection
  // -------------------------------------------------------------
  console.log("\n--- 6. Action Links & Contact Form Detection ---");

  const sampleLinks = [
    { href: "/contact-us", text: "Get in Touch" },
    { href: "/about-us", text: "About Company" },
    { href: "https://calendly.com/nairobidoc/30min", text: "Book an Appointment" },
    { href: "/book-now", text: "Reserve Service" },
    { href: "/privacy-policy", text: "Privacy" },
  ];
  const classifiedLinks = classifyActionLinks(sampleLinks, "https://nairobidoc.co.ke");
  assert(classifiedLinks.contactPages.length === 2, `Identified 2 contact pages (got ${classifiedLinks.contactPages.length})`);
  assert(classifiedLinks.bookingPages.length === 2, `Identified 2 booking / Calendly links (got ${classifiedLinks.bookingPages.length})`);

  const sampleFormHtml = `
    <form action="/submit-inquiry" method="POST">
      <input type="text" name="name" />
      <input type="email" name="email" required />
      <textarea name="message"></textarea>
      <button type="submit">Send Message</button>
    </form>
  `;
  assert(detectContactForm(sampleFormHtml) === true, "Public contact form correctly detected");
  assert(detectContactForm("<div>Just text, no form</div>") === false, "Missing form correctly identified as false");

  // -------------------------------------------------------------
  // 7. Lead Contact Enrichment Pipeline Orchestration
  // -------------------------------------------------------------
  console.log("\n--- 7. Lead Contact Enrichment Pipeline ---");

  const mockLead: PhysicalLead = {
    id: "test-lead-1",
    type: "physical",
    businessName: "Elite Plumbers Nairobi",
    phone: "+254700111222",
    phoneFormatted: "+254 700 111222",
    country: "Kenya",
    city: "Nairobi",
    hasWebsite: false,
    noWebsiteConfidence: "Verified",
    sourceProvider: "osm",
    email: "contact@eliteplumbers.ke",
    whatsapp: "+254700111222",
    status: "NEW",
    estimatedValue: 1500,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const enrichedLead = await enrichLeadContacts(mockLead, { skipCrawl: true });
  assert(enrichedLead.primaryPhone === "+254700111222", "Primary phone retained");
  assert(enrichedLead.primaryEmail === "contact@eliteplumbers.ke", "Primary email enriched from provider metadata");
  assert(enrichedLead.primaryWhatsApp === "https://wa.me/254700111222", "WhatsApp direct link generated");
  assert(enrichedLead.phones.length >= 1, "Phone contact item created with source provenance");

  console.log("\n=======================================================");
  console.log(` SUMMARY: ${passed} / ${passed + failed} TESTS PASSED (${((passed / (passed + failed)) * 100).toFixed(0)}%)`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
