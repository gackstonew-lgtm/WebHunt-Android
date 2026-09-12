/**
 * WebHunt Comprehensive Security & Hardening Verification Test Suite
 * Tests SSRF protection, IDOR defenses, Rate Limiting, Fail-Fast Secrets,
 * Admin Bootstrap reconciliation, and Multi-tenant DB isolation.
 */

import prisma from "../lib/db";
import { validateUrlForSsrf } from "../lib/security/ssrf";
import { checkRateLimit } from "../lib/security/rate-limit";
import { getSessionSecret } from "../lib/auth/session";
import { getOtpSaltSecret } from "../lib/auth/password";
import { getEncryptionKey } from "../lib/security/crypto";
import { saveLeadToPipelineAction } from "../app/actions/leads";
import { bootstrapAdmin } from "./bootstrap-admin";
import { verifyPassword } from "../lib/auth/password";

async function runSecurityTests() {
  console.log("===============================================================");
  console.log(" WEBHUNT PRODUCTION SECURITY & HARDENING AUDIT");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
      failed++;
    }
  }

  // --- 1. SSRF & Cloud Metadata Protection ---
  console.log("--- 1. SSRF Defense & Cloud Metadata Filtering ---");
  const ssrfTestCases = [
    { url: "http://127.0.0.1:8080/admin", shouldAllow: false, label: "Loopback IPv4 (127.0.0.1)" },
    { url: "http://localhost:3000/api", shouldAllow: false, label: "Localhost hostname" },
    { url: "http://169.254.169.254/latest/meta-data/", shouldAllow: false, label: "AWS/GCP/Azure Cloud Metadata (169.254.169.254)" },
    { url: "http://10.0.0.1/internal", shouldAllow: false, label: "Private 10.0.0.0/8 subnet" },
    { url: "http://172.16.0.1/internal", shouldAllow: false, label: "Private 172.16.0.0/12 subnet" },
    { url: "http://192.168.1.1/router", shouldAllow: false, label: "Private 192.168.0.0/16 subnet" },
    { url: "http://[::1]/internal", shouldAllow: false, label: "IPv6 Loopback (::1)" },
    { url: "ftp://example.com/file", shouldAllow: false, label: "Disallowed Protocol (ftp://)" },
    { url: "https://google.com", shouldAllow: true, label: "Public Valid HTTPS (google.com)" },
  ];

  for (const tc of ssrfTestCases) {
    const res = await validateUrlForSsrf(tc.url);
    assert(res.isSafe === tc.shouldAllow, `SSRF check: ${tc.label} (isSafe: ${res.isSafe})`);
  }

  // --- 2. Rate Limiting sliding window ---
  console.log("\n--- 2. Sliding Window Rate Limiter ---");
  const testIp = `test-ip-${Date.now()}`;
  const limit = 3;
  const windowSeconds = 2;

  const r1 = checkRateLimit(testIp, limit, windowSeconds);
  const r2 = checkRateLimit(testIp, limit, windowSeconds);
  const r3 = checkRateLimit(testIp, limit, windowSeconds);
  const r4 = checkRateLimit(testIp, limit, windowSeconds); // Should be blocked

  assert(r1.allowed && r2.allowed && r3.allowed, "Permits requests within limit boundary (3/3)");
  assert(!r4.allowed, "Rejects request exceeding sliding window limit (4/3 blocked)");
  assert(r4.retryAfterSeconds > 0, "Returns positive retryAfterSeconds header calculation");

  // --- 3. Fail-Fast Secrets in Production Mode ---
  console.log("\n--- 3. Fail-Fast Secrets Engine ---");
  const envRef = process.env as Record<string, string | undefined>;
  const originalEnv = envRef.NODE_ENV;
  const originalSecret = envRef.ENCRYPTION_SECRET;

  try {
    envRef.NODE_ENV = "production";
    delete envRef.ENCRYPTION_SECRET;

    let threwSession = false;
    try {
      getSessionSecret();
    } catch {
      threwSession = true;
    }
    assert(threwSession, "getSessionSecret() throws in production when ENCRYPTION_SECRET is absent");

    let threwOtp = false;
    try {
      getOtpSaltSecret();
    } catch {
      threwOtp = true;
    }
    assert(threwOtp, "getOtpSaltSecret() throws in production when ENCRYPTION_SECRET is absent");

    let threwCrypto = false;
    try {
      getEncryptionKey();
    } catch {
      threwCrypto = true;
    }
    assert(threwCrypto, "getEncryptionKey() throws in production when ENCRYPTION_SECRET is absent");
  } finally {
    envRef.NODE_ENV = originalEnv;
    if (originalSecret) envRef.ENCRYPTION_SECRET = originalSecret;
  }

  // --- 4. Admin Bootstrap Reconciliation & Password Preservation ---
  console.log("\n--- 4. Admin Bootstrap Reconciliation ---");
  const adminTestEmail = `sec_admin_${Date.now()}@webhunt.io`;
  const customAdminPassword = "MyCustomPreservedPassword123!";

  const originalAdminEmail = process.env.WEBHUNT_ADMIN_EMAIL;
  try {
    process.env.WEBHUNT_ADMIN_EMAIL = adminTestEmail;

    // 1. Initial creation
    const firstAdmin = await bootstrapAdmin(customAdminPassword);
    assert(!!firstAdmin?.id, "Initial admin created via bootstrap");

    // 2. Deployment reconciliation run with DIFFERENT default password
    const reconciledAdmin = await bootstrapAdmin("DifferentPassword999!");
    assert(reconciledAdmin?.id === firstAdmin.id, "Reconciliation returns same administrator user ID");

    // Verify that the original password hash remains active and unchanged
    const adminUser = await prisma.user.findUnique({ where: { email: adminTestEmail } });
    const passwordMatches = await verifyPassword(customAdminPassword, adminUser?.passwordHash || "");
    assert(passwordMatches, "Existing admin password is fully preserved across redeployments");

    // Cleanup test admin
    if (adminUser) {
      await prisma.userProfile.deleteMany({ where: { userId: adminUser.id } });
      await prisma.user.delete({ where: { id: adminUser.id } });
    }
  } finally {
    process.env.WEBHUNT_ADMIN_EMAIL = originalAdminEmail;
  }

  // --- 5. Multi-User Database Lead Isolation ---
  console.log("\n--- 5. Multi-Tenant Pipeline Compound Isolation ---");
  const userA = await prisma.user.create({ data: { email: `userA_${Date.now()}@webhunt.io`, name: "User A" } });
  const userB = await prisma.user.create({ data: { email: `userB_${Date.now()}@webhunt.io`, name: "User B" } });

  const sharedLeadPhone = "+254700999888";
  const sharedBusinessName = "Universal Motors Nairobi";

  // User A saves lead
  const leadA = await saveLeadToPipelineAction(
    {
      id: `leadA-${Date.now()}`,
      type: "physical",
      businessName: sharedBusinessName,
      phone: sharedLeadPhone,
      phoneFormatted: "+254 700 999 888",
      status: "CONTACTED",
      estimatedValue: 2000,
      notes: "User A exclusive lead note",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    userA.id
  );

  // User B saves SAME lead independently
  const leadB = await saveLeadToPipelineAction(
    {
      id: `leadB-${Date.now()}`,
      type: "physical",
      businessName: sharedBusinessName,
      phone: sharedLeadPhone,
      phoneFormatted: "+254 700 999 888",
      status: "NEW",
      estimatedValue: 3500,
      notes: "User B independent notes",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    userB.id
  );

  assert(leadA.success === true && !!leadA.data?.id, "User A successfully saves lead");
  assert(leadB.success === true && !!leadB.data?.id, "User B successfully saves same real-world lead");
  assert(leadA.data?.id !== leadB.data?.id, "Leads have distinct primary keys and pipeline state");
  assert(leadA.data?.notes === "User A exclusive lead note", "User A notes are preserved");
  assert(leadB.data?.notes === "User B independent notes", "User B notes are preserved");

  // Cleanup
  await prisma.lead.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });

  console.log("\n===============================================================");
  console.log(` AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests()
  .catch((err) => {
    console.error("Audit suite error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
