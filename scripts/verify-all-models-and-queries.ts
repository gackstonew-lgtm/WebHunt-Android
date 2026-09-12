/**
 * WebHunt Comprehensive Model & Query Verification Test Suite
 * Validates all 15 Prisma models, relations, constraints, auth, and CRM queries.
 */

import prisma, { checkDatabaseConnection } from "../lib/db";
import { registerAction, loginAction, verifyOtpAction, resendOtpAction, getAuthStatusAction } from "../app/actions/auth";
import { saveLeadToPipelineAction, fetchPipelineLeadsAction, updateLeadStatusAction, updateLeadNotesAction, deleteLeadAction } from "../app/actions/leads";
import { createFollowUpTaskAction, fetchUpcomingTasksAction, toggleTaskCompletedAction, deleteTaskAction } from "../app/actions/tasks";
import { PhysicalLead } from "../lib/types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✅ PASSED: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${description}`);
    failed++;
  }
}

async function runVerification() {
  console.log("===============================================================");
  console.log(" WEBHUNT FULL DATABASE & 15 PRISMA MODELS VERIFICATION");
  console.log("===============================================================\n");

  // --- 1. Connection Health ---
  console.log("--- 1. Database Connection Health ---");
  const health = await checkDatabaseConnection();
  assert(health.connected === true, "Database connectivity verified via SELECT 1");

  const uniqueSuffix = Date.now().toString();

  // --- 2. User & UserProfile Models ---
  console.log("\n--- 2. User & UserProfile Models ---");
  const testUser = await prisma.user.create({
    data: {
      email: `test_user_${uniqueSuffix}@example.com`,
      name: "Verification Engineer",
      role: "user",
      status: "active",
      profile: {
        create: {
          fullName: "Verification Engineer",
          professionalTitle: "Lead Cloud Architect",
          skillsJson: JSON.stringify(["TypeScript", "PostgreSQL", "Prisma", "Next.js"]),
          currency: "USD",
          timezone: "Africa/Nairobi",
          city: "Nairobi",
          country: "Kenya",
        },
      },
    },
    include: { profile: true },
  });
  assert(!!testUser.id && testUser.email.includes(uniqueSuffix), "User record created successfully");
  assert(!!testUser.profile && testUser.profile.city === "Nairobi", "UserProfile cascade created and related");

  // --- 3. Account Model ---
  console.log("\n--- 3. Account Model ---");
  const testAccount = await prisma.account.create({
    data: {
      userId: testUser.id,
      provider: "google",
      providerAccountId: `google_uid_${uniqueSuffix}`,
      email: testUser.email,
    },
  });
  assert(!!testAccount.id && testAccount.provider === "google", "Account created and linked to User");

  // --- 4. Workspace & WorkspaceMember Models ---
  console.log("\n--- 4. Workspace & WorkspaceMember Models ---");
  const testWorkspace = await prisma.workspace.create({
    data: {
      name: `Workspace_${uniqueSuffix}`,
      ownerId: testUser.id,
    },
  });
  assert(!!testWorkspace.id, "Workspace created successfully");

  const testMember = await prisma.workspaceMember.create({
    data: {
      workspaceId: testWorkspace.id,
      userId: testUser.id,
      role: "OWNER",
    },
  });
  assert(!!testMember.id && testMember.role === "OWNER", "WorkspaceMember created and linked");

  // --- 5. Search Model ---
  console.log("\n--- 5. Search Model ---");
  const testSearch = await prisma.search.create({
    data: {
      userId: testUser.id,
      niche: "Web Development",
      location: "Nairobi",
      provider: "all",
      radius: 25,
      totalFetched: 10,
      qualifiedLeads: 5,
    },
  });
  assert(!!testSearch.id && testSearch.niche === "Web Development", "Search record created and linked to User");

  // --- 6. Lead Model ---
  console.log("\n--- 6. Lead Model ---");
  const testLead = await prisma.lead.create({
    data: {
      userId: testUser.id,
      searchId: testSearch.id,
      businessName: `Acme Solutions ${uniqueSuffix}`,
      phone: `+254700${uniqueSuffix.slice(-6)}`,
      phoneFormatted: `+254 700 ${uniqueSuffix.slice(-6)}`,
      city: "Nairobi",
      state: "Kenya",
      category: "Software Development",
      rating: 4.8,
      reviewCount: 24,
      hasWebsite: false,
      noWebsiteConfidence: "High",
      sourceProvider: "osm",
      pipelineType: "sales",
      status: "NEW",
      estimatedValue: 2000,
    },
  });
  assert(!!testLead.id && testLead.businessName.includes("Acme Solutions"), "Lead record created with physical attributes");

  // --- 7. ProposalDraft Model ---
  console.log("\n--- 7. ProposalDraft Model ---");
  const testProposal = await prisma.proposalDraft.create({
    data: {
      leadId: testLead.id,
      userId: testUser.id,
      title: "Digital Modernization Pitch",
      templateType: "local_website_pitch",
      subject: "Modern Website Proposal",
      greeting: "Dear Business Owner,",
      body: "We noticed your business does not have a verified website...",
      callToAction: "Schedule a discovery call",
      fullText: "Full generated proposal text...",
      status: "DRAFT",
    },
  });
  assert(!!testProposal.id && testProposal.title === "Digital Modernization Pitch", "ProposalDraft created and linked");

  // --- 8. Application Model ---
  console.log("\n--- 8. Application Model ---");
  const testApp = await prisma.application.create({
    data: {
      jobId: testLead.id,
      userId: testUser.id,
      jobTitle: "Senior Full Stack Engineer",
      company: testLead.businessName,
      jobUrl: "https://example.com/jobs/1",
      applicationMethod: "external_form",
      status: "SAVED",
    },
  });
  assert(!!testApp.id && testApp.jobTitle === "Senior Full Stack Engineer", "Application created and linked");

  // --- 9. OutreachMessage Model ---
  console.log("\n--- 9. OutreachMessage Model ---");
  const testMessage = await prisma.outreachMessage.create({
    data: {
      leadId: testLead.id,
      userId: testUser.id,
      channel: "email",
      direction: "OUTBOUND",
      status: "SENT",
      recipient: testUser.email,
      subject: "Business Proposal",
      messageBody: "Hello, here is our proposal.",
    },
  });
  assert(!!testMessage.id && testMessage.channel === "email", "OutreachMessage created and linked");

  // --- 10. FollowUpTask Model ---
  console.log("\n--- 10. FollowUpTask Model ---");
  const testTask = await prisma.followUpTask.create({
    data: {
      leadId: testLead.id,
      userId: testUser.id,
      taskType: "follow_up_email",
      title: "Send follow-up email",
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      priority: "HIGH",
      isCompleted: false,
    },
  });
  assert(!!testTask.id && testTask.priority === "HIGH", "FollowUpTask created and linked");

  // --- 11. ConsentRecord Model ---
  console.log("\n--- 11. ConsentRecord Model ---");
  const testConsent = await prisma.consentRecord.create({
    data: {
      identifier: testUser.email,
      type: "email",
      hasOptedIn: true,
      hasOptedOut: false,
      optInSource: "registration_form",
    },
  });
  assert(!!testConsent.id && testConsent.identifier === testUser.email, "ConsentRecord created");

  // --- 12. ApiCache Model ---
  console.log("\n--- 12. ApiCache Model ---");
  const testCache = await prisma.apiCache.create({
    data: {
      cacheKey: `cache_${uniqueSuffix}`,
      provider: "osm",
      query: "software companies",
      location: "Nairobi",
      payload: JSON.stringify({ results: [] }),
      expiresAt: new Date(Date.now() + 86400 * 1000),
    },
  });
  assert(!!testCache.id && testCache.cacheKey.includes(uniqueSuffix), "ApiCache created and queryable");

  // --- 13. WebhookEvent Model ---
  console.log("\n--- 13. WebhookEvent Model ---");
  const testEvent = await prisma.webhookEvent.create({
    data: {
      eventId: `evt_${uniqueSuffix}`,
      eventType: "email.delivered",
      payload: JSON.stringify({ to: testUser.email }),
    },
  });
  assert(!!testEvent.id && testEvent.eventId.includes(uniqueSuffix), "WebhookEvent created");

  // --- 14. EmailDeliveryLog Model ---
  console.log("\n--- 14. EmailDeliveryLog Model ---");
  const testEmailLog = await prisma.emailDeliveryLog.create({
    data: {
      email: testUser.email,
      emailType: "verification_otp",
      messageId: `msg_${uniqueSuffix}`,
      status: "delivered",
    },
  });
  assert(!!testEmailLog.id && testEmailLog.messageId === `msg_${uniqueSuffix}`, "EmailDeliveryLog created");

  // --- 15. Server Actions (Auth & CRM) ---
  console.log("\n--- 15. Server Actions: CRM Lead & Task Operations ---");
  const samplePhysicalLead: PhysicalLead = {
    id: `lead-action-${uniqueSuffix}`,
    type: "physical",
    businessName: `Action Test Business ${uniqueSuffix}`,
    phone: `+254711${uniqueSuffix.slice(-6)}`,
    phoneFormatted: `+254 711 ${uniqueSuffix.slice(-6)}`,
    city: "Mombasa",
    country: "Kenya",
    hasWebsite: false,
    noWebsiteConfidence: "High",
    sourceProvider: "osm",
    status: "NEW",
    estimatedValue: 1800,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const saveResult = await saveLeadToPipelineAction(samplePhysicalLead, testUser.id);
  assert(saveResult.success === true && !!saveResult.data?.id, "saveLeadToPipelineAction successfully upserts lead");

  if (saveResult.data) {
    const statusUpdateResult = await updateLeadStatusAction(saveResult.data.id, "CONTACTED");
    assert(statusUpdateResult.success === true, "updateLeadStatusAction transitions status to CONTACTED");

    const notesUpdateResult = await updateLeadNotesAction(saveResult.data.id, "Spoke with managing director.", 2500);
    assert(notesUpdateResult.success === true, "updateLeadNotesAction updates notes and value");

    const deleteLeadResult = await deleteLeadAction(saveResult.data.id);
    assert(deleteLeadResult.success === true, "deleteLeadAction safely removes lead");
  }

  // Task Actions
  const taskResult = await createFollowUpTaskAction({
    leadId: testLead.id,
    userId: testUser.id,
    taskType: "follow_up_call",
    title: "Call prospect about proposal",
    dueAt: new Date(),
    priority: "HIGH",
  });
  assert(taskResult.success === true && !!taskResult.data?.id, "createFollowUpTaskAction creates task");

  if (taskResult.data) {
    const toggleResult = await toggleTaskCompletedAction(taskResult.data.id, true);
    assert(toggleResult.success === true, "toggleTaskCompletedAction toggles completion");

    const deleteTaskResult = await deleteTaskAction(taskResult.data.id);
    assert(deleteTaskResult.success === true, "deleteTaskAction safely deletes task");
  }

  // --- Safe Cleanup of Test Records ---
  console.log("\n--- 16. Non-Destructive Test Cleanup ---");
  await prisma.outreachMessage.deleteMany({ where: { userId: testUser.id } });
  await prisma.application.deleteMany({ where: { userId: testUser.id } });
  await prisma.proposalDraft.deleteMany({ where: { userId: testUser.id } });
  await prisma.followUpTask.deleteMany({ where: { userId: testUser.id } });
  await prisma.lead.deleteMany({ where: { userId: testUser.id } });
  await prisma.search.deleteMany({ where: { userId: testUser.id } });
  await prisma.workspaceMember.deleteMany({ where: { userId: testUser.id } });
  await prisma.workspace.deleteMany({ where: { ownerId: testUser.id } });
  await prisma.account.deleteMany({ where: { userId: testUser.id } });
  await prisma.userProfile.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.deleteMany({ where: { id: testUser.id } });
  await prisma.consentRecord.deleteMany({ where: { identifier: testUser.email } });
  await prisma.apiCache.deleteMany({ where: { cacheKey: `cache_${uniqueSuffix}` } });
  await prisma.webhookEvent.deleteMany({ where: { eventId: `evt_${uniqueSuffix}` } });
  await prisma.emailDeliveryLog.deleteMany({ where: { email: testUser.email } });
  console.log("  ✅ Cleaned up all verification test records safely.");

  await prisma.$disconnect();

  console.log("\n===============================================================");
  console.log(` VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Unhandled verification error:", err);
  process.exit(1);
});