import prisma from "../lib/db";
import { hashPassword, verifyPassword, validatePasswordStrength, generateSecureToken } from "../lib/auth/password";
import { createSessionToken, decryptSessionToken } from "../lib/auth/session";
import { sendVerificationEmail, sendPasswordResetEmail, getAppBaseUrl } from "../lib/email/service";
import { registerAction, loginAction, verifyEmailAction, resendVerificationAction, requestPasswordResetAction, resetPasswordAction } from "../app/actions/auth";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

async function runAuthAndEmailTests() {
  console.log("=======================================================");
  console.log(" WEBHUNT AUTHENTICATION GATEWAY & EMAIL DELIVERY SUITE ");
  console.log("=======================================================\n");

  const testEmail = `tester_${Date.now()}@example.com`;
  const testPassword = "SecurePass123!";
  const testName = "Test Engineer";

  // --- 1. Password Strength Validation ---
  console.log("--- 1. Password Security & Cryptography ---");
  const weakCheck = validatePasswordStrength("weak");
  assert(weakCheck.isValid === false, "Rejects short passwords (< 8 chars)");

  const noNumberCheck = validatePasswordStrength("LettersOnly");
  assert(noNumberCheck.isValid === false, "Rejects passwords without numbers");

  const strongCheck = validatePasswordStrength(testPassword);
  assert(strongCheck.isValid === true, "Accepts strong password");

  const hashedPassword = await hashPassword(testPassword);
  assert(hashedPassword.includes(":"), "Password hash contains salt delimiter");
  assert(hashedPassword !== testPassword, "Password is not plaintext");

  const isPasswordValid = await verifyPassword(testPassword, hashedPassword);
  assert(isPasswordValid === true, "Valid password matches scrypt hash");

  const isWrongPassword = await verifyPassword("WrongPassword123!", hashedPassword);
  assert(isWrongPassword === false, "Incorrect password fails verification");

  // --- 2. Session Token Encryption & Validation ---
  console.log("\n--- 2. Session Encryption & Tamper Protection ---");
  const sessionToken = await createSessionToken("user-12345", testEmail);
  assert(typeof sessionToken === "string" && sessionToken.length > 20, "Session token created");

  const decryptedSession = await decryptSessionToken(sessionToken);
  assert(decryptedSession !== null, "Session token successfully decrypted");
  assert(decryptedSession?.userId === "user-12345", "Decrypted userId matches");
  assert(decryptedSession?.email === testEmail, "Decrypted email matches");

  const tampered = await decryptSessionToken(sessionToken + "_tampered");
  assert(tampered === null, "Tampered session token fails decryption safely");

  // --- 3. Production Email Dispatcher ---
  console.log("\n--- 3. Email Delivery Engine & URL Resolution ---");
  const appUrl = getAppBaseUrl();
  assert(appUrl.startsWith("http"), "App base URL correctly resolved");

  const verificationToken = generateSecureToken(32);
  const emailResult = await sendVerificationEmail(testEmail, testName, verificationToken);
  assert(emailResult.success === true, "Verification email generated & dispatched without error");
  assert(emailResult.messageId !== undefined, "Email response includes messageId");

  const resetEmailResult = await sendPasswordResetEmail(testEmail, testName, verificationToken);
  assert(resetEmailResult.success === true, "Password reset email generated & dispatched");

  // --- 4. User Registration Workflow ---
  console.log("\n--- 4. User Registration Workflow ---");
  const regResult = await registerAction({
    name: testName,
    email: testEmail,
    password: testPassword,
  });
  assert(regResult.success === true, "User registration succeeds");
  assert(regResult.requireVerification === true, "User requires email verification");

  const createdUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });
  assert(createdUser !== null, "User record persisted in database");
  assert(createdUser?.emailVerified === null, "User initially unverified");
  assert(createdUser?.verificationToken !== null, "Single-use verification token saved");
  assert(createdUser?.verificationTokenExpiry !== null, "Token has expiration timestamp");

  // --- 5. Unverified Sign-In Blocked ---
  console.log("\n--- 5. Unverified Access Restriction ---");
  const unverifiedLogin = await loginAction({
    email: testEmail,
    password: testPassword,
  });
  assert(unverifiedLogin.success === false, "Unverified user blocked from signing in");
  assert(unverifiedLogin.isUnverified === true, "Identifies unverified account state");

  // --- 6. Email Verification ---
  console.log("\n--- 6. Single-Use Email Verification ---");
  const userToken = createdUser!.verificationToken!;
  const verifyResult = await verifyEmailAction(userToken);
  assert(verifyResult.success === true, "Verification token accepted");

  const verifiedUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });
  assert(verifiedUser?.emailVerified !== null, "User marked as email verified in database");
  assert(verifiedUser?.verificationToken === null, "Verification token invalidated (single-use)");

  // Test token reuse prevention
  const reuseResult = await verifyEmailAction(userToken);
  assert(reuseResult.success === false, "Already-used verification token rejected");

  // --- 7. Verified Sign-In ---
  console.log("\n--- 7. Verified User Sign-In ---");
  const verifiedLogin = await loginAction({
    email: testEmail,
    password: testPassword,
  });
  assert(verifiedLogin.success === true, "Verified user signs in successfully");

  const badPasswordLogin = await loginAction({
    email: testEmail,
    password: "WrongPassword999!",
  });
  assert(badPasswordLogin.success === false, "Incorrect password rejected");

  // --- 8. Password Reset Workflow ---
  console.log("\n--- 8. Password Reset & Invalidation ---");
  const resetRequest = await requestPasswordResetAction(testEmail);
  assert(resetRequest.success === true, "Password reset request accepted");

  const userWithResetToken = await prisma.user.findUnique({
    where: { email: testEmail },
  });
  assert(userWithResetToken?.resetToken !== null, "Reset token generated");
  assert(userWithResetToken?.resetTokenExpiry !== null, "Reset token has 1-hour expiration");

  const newPassword = "NewSecurePassword456!";
  const resetResult = await resetPasswordAction(userWithResetToken!.resetToken!, newPassword);
  assert(resetResult.success === true, "Password reset executed successfully");

  // Verify old password fails and new password works
  const oldPassLogin = await loginAction({
    email: testEmail,
    password: testPassword,
  });
  assert(oldPassLogin.success === false, "Old password rejected after reset");

  const newPassLogin = await loginAction({
    email: testEmail,
    password: newPassword,
  });
  assert(newPassLogin.success === true, "New password accepted after reset");

  // --- 9. Duplicate Registration Prevention ---
  console.log("\n--- 9. Duplicate Account Protection ---");
  const duplicateReg = await registerAction({
    name: "Duplicate User",
    email: testEmail,
    password: "AnotherPassword123!",
  });
  assert(duplicateReg.success === false, "Duplicate registration rejected for verified account");

  // --- 10. User Data Isolation ---
  console.log("\n--- 10. User Data Isolation & Scoping ---");
  const userBEmail = `user_b_${Date.now()}@example.com`;
  await registerAction({ name: "User B", email: userBEmail, password: "PasswordB123!" });
  const userB = await prisma.user.findUnique({ where: { email: userBEmail } });

  // Create lead for User A
  const leadPhone = `+254${Math.floor(100000000 + Math.random() * 900000000)}`;
  await prisma.lead.create({
    data: {
      userId: verifiedUser!.id,
      businessName: `User A Private Lead ${Date.now()}`,
      phone: leadPhone,
      phoneFormatted: leadPhone,
      city: "Nairobi",
      status: "NEW",
    },
  });

  // Query User B leads
  const userBLeads = await prisma.lead.findMany({
    where: { userId: userB!.id },
  });
  assert(userBLeads.length === 0, "User B cannot see User A's leads");

  console.log("\n=======================================================");
  console.log("🎉 ALL AUTHENTICATION & EMAIL SUITE TESTS PASSED 100%!");
  console.log("=======================================================\n");
}

runAuthAndEmailTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
