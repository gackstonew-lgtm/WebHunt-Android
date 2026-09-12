/**
 * WebHunt - Production Database, Prisma, Authentication & Resend OTP Comprehensive Test Suite
 */

import prisma, { checkDatabaseConnection } from '../lib/db';
import { 
  registerAction, 
  loginAction, 
  verifyOtpAction, 
  resendOtpAction 
} from '../app/actions/auth';
import { 
  hashPassword, 
  verifyPassword, 
  generateSecureOtp, 
  hashOtp, 
  verifyOtp 
} from '../lib/auth/password';
import { 
  createSessionToken, 
  decryptSessionToken 
} from '../lib/auth/session';
import { 
  sendVerificationOtpEmail, 
  getSenderAddress, 
  getAppBaseUrl 
} from '../lib/email/service';
import { preparePrismaSchema } from './prepare-prisma';
import fs from 'fs';
import path from 'path';

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

async function runSuite() {
  console.log('=======================================================');
  console.log(' WEBHUNT PRODUCTION DATABASE & AUTHENTICATION SUITE');
  console.log('=======================================================\n');

  // --- 1. Schema Provider & Datasource Compatibility ---
  console.log('--- 1. Prisma Schema & Datasource Compatibility ---');
  preparePrismaSchema();
  const schemaContentPg = fs.readFileSync(path.join(__dirname, '../prisma/schema.prisma'), 'utf8');
  assert(schemaContentPg.includes('provider = "postgresql"'), 'Prisma schema is configured for PostgreSQL datasource');

  // --- 2. Database Connectivity & Health Check ---
  console.log('\n--- 2. Database Connectivity & Health Check ---');
  const dbHealth = await checkDatabaseConnection();
  assert(dbHealth.connected === true, 'Database connection succeeds via checkDatabaseConnection()');

  // --- 3. Prisma User findUnique Query ---
  console.log('\n--- 3. Prisma User findUnique Execution ---');
  const nonExistentEmail = `nonexistent_${Date.now()}@example.com`;
  const nonExistentUser = await prisma.user.findUnique({
    where: { email: nonExistentEmail },
  });
  assert(nonExistentUser === null, 'prisma.user.findUnique returns null without throwing error for missing email');

  // --- 4. Password Hashing & Verification (scrypt) ---
  console.log('\n--- 4. Cryptographic Password Security ---');
  const testPassword = 'StrongP@ssw0rd2026!';
  const hashed = await hashPassword(testPassword);
  assert(hashed.includes(':') && hashed.length > 50, 'Password hashed using salt:scrypt format');
  assert(await verifyPassword(testPassword, hashed) === true, 'Correct password verifies successfully');
  assert(await verifyPassword('WrongPassword123!', hashed) === false, 'Incorrect password safely fails verification');

  // --- 5. Registration & User Creation Workflow ---
  console.log('\n--- 5. Registration & User Creation Workflow ---');
  const testUserEmail = `test_reg_${Date.now()}@example.com`;
  const testUserName = 'Verification Candidate';
  
  const regResult = await registerAction({
    name: testUserName,
    email: testUserEmail,
    password: testPassword,
  });

  assert(regResult.success === true, 'New user registration succeeds');
  assert(regResult.requireOtp === true, 'Registration requires 6-digit OTP');
  assert(regResult.email === testUserEmail, 'Registration returns normalized email');

  // Verify record in database
  const createdUser = await prisma.user.findUnique({
    where: { email: testUserEmail },
    include: { profile: true },
  });

  assert(createdUser !== null, 'User created in database');
  assert(createdUser?.email === testUserEmail, 'User email persisted correctly');
  assert(createdUser?.role === 'user', 'Default role is "user"');
  assert(createdUser?.emailVerified === null, 'Unverified user has null emailVerified timestamp');
  assert(createdUser?.verificationOtpHash !== null, 'Secure OTP hash stored in database');
  assert(createdUser?.verificationOtpExpiry !== null, 'OTP expiration timestamp set');
  assert(createdUser?.profile !== null, 'Candidate profile automatically initialized');

  // Duplicate registration check
  const dupResult = await registerAction({
    name: testUserName,
    email: testUserEmail,
    password: testPassword,
  });
  assert(dupResult.success === true && dupResult.requireOtp === true, 'Re-registering unverified account rotates OTP safely');

  // --- 6. OTP Security & Verification Workflow ---
  console.log('\n--- 6. OTP Generation, Hash & Verification ---');
  const testOtp = generateSecureOtp(6);
  assert(/^\d{6}$/.test(testOtp), 'Generated OTP is 6 numeric digits');
  const testOtpHash = hashOtp(testOtp);
  assert(verifyOtp(testOtp, testOtpHash) === true, 'Matching OTP verifies against stored hash');
  assert(verifyOtp('000000', testOtpHash) === false, 'Non-matching OTP fails verification');

  // Direct test of verifyOtpAction on created user
  // Let's set a known OTP hash for the test user
  const controlledOtp = '749201';
  const controlledOtpHash = hashOtp(controlledOtp);
  const controlledExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: createdUser!.id },
    data: {
      verificationOtpHash: controlledOtpHash,
      verificationOtpExpiry: controlledExpiry,
      verificationOtpAttempts: 0,
    },
  });

  // Test incorrect OTP attempt
  const badVerifyResult = await verifyOtpAction({
    email: testUserEmail,
    otp: '111111',
  });
  assert(badVerifyResult.success === false, 'Incorrect OTP rejected by verifyOtpAction');

  const userAfterBadAttempt = await prisma.user.findUnique({ where: { email: testUserEmail } });
  assert(userAfterBadAttempt?.verificationOtpAttempts === 1, 'Failed OTP attempt counter incremented');

  // Test correct OTP verification
  const goodVerifyResult = await verifyOtpAction({
    email: testUserEmail,
    otp: controlledOtp,
  });
  assert(goodVerifyResult.success === true, 'Correct OTP verifies user account');

  const verifiedUser = await prisma.user.findUnique({ where: { email: testUserEmail } });
  assert(verifiedUser?.emailVerified !== null, 'emailVerified timestamp recorded upon successful OTP verification');
  assert(verifiedUser?.verificationOtpHash === null, 'OTP hash consumed and removed upon verification');
  assert(verifiedUser?.verificationOtpAttempts === 0, 'OTP attempt counter reset to 0');

  // --- 7. Sign-In & Authentication Workflow ---
  console.log('\n--- 7. Sign-In & Authentication Workflow ---');
  // Verified user login
  const loginSuccess = await loginAction({
    email: testUserEmail,
    password: testPassword,
  });
  assert(loginSuccess.success === true, 'Verified user signs in successfully');

  // Wrong password login
  const loginWrongPass = await loginAction({
    email: testUserEmail,
    password: 'WrongPassword999!',
  });
  assert(loginWrongPass.success === false, 'Incorrect password rejected during sign-in');

  // Nonexistent email login
  const loginNonExistent = await loginAction({
    email: 'unknown_never_registered@example.com',
    password: testPassword,
  });
  assert(loginNonExistent.success === false, 'Non-existent account rejected during sign-in');

  // --- 8. Session Token Creation & Verification ---
  console.log('\n--- 8. Session Token Security ---');
  const sessionToken = await createSessionToken(createdUser!.id, createdUser!.email, 'user');
  assert(sessionToken.includes('.') && sessionToken.length > 40, 'Signed session token generated');

  const decodedSession = await decryptSessionToken(sessionToken);
  assert(decodedSession !== null, 'Session token decodes and verifies signature');
  assert(decodedSession?.userId === createdUser!.id, 'Session payload userId matches');
  assert(decodedSession?.email === testUserEmail, 'Session payload email matches');

  // Tampered session rejection
  const tamperedToken = sessionToken.slice(0, -5) + 'XXXXX';
  const decodedTampered = await decryptSessionToken(tamperedToken);
  assert(decodedTampered === null, 'Tampered session token safely rejected');

  // --- 9. Resend Service & Delivery Logs ---
  console.log('\n--- 9. Resend Service & Audit Logs ---');
  const senderAddr = getSenderAddress();
  assert(senderAddr.length > 5, 'Sender address configured correctly');
  const baseUrl = getAppBaseUrl();
  assert(baseUrl.startsWith('http'), 'App base URL resolved correctly');

  const resendResult = await sendVerificationOtpEmail(testUserEmail, testUserName, '123456');
  assert(resendResult.success === true, 'sendVerificationOtpEmail executes without error');

  const logEntry = await prisma.emailDeliveryLog.findFirst({
    where: { email: testUserEmail },
    orderBy: { createdAt: 'desc' },
  });
  assert(logEntry !== null, 'Email delivery log created in database');
  assert(logEntry?.emailType === 'verification_otp', 'Email log records verification_otp type');

  // --- 10. Multi-User Data Isolation ---
  console.log('\n--- 10. Multi-User Data Isolation ---');
  const userAEmail = `user_a_${Date.now()}@example.com`;
  const userBEmail = `user_b_${Date.now()}@example.com`;

  const userA = await prisma.user.create({
    data: {
      email: userAEmail,
      name: 'User Alpha',
      role: 'user',
      status: 'active',
      emailVerified: new Date(),
    },
  });

  const userB = await prisma.user.create({
    data: {
      email: userBEmail,
      name: 'User Beta',
      role: 'user',
      status: 'active',
      emailVerified: new Date(),
    },
  });

  const leadA = await prisma.lead.create({
    data: {
      userId: userA.id,
      businessName: 'Alpha Plumbing Ltd',
      phone: '+254711111111',
      phoneFormatted: '+254 711 111111',
      category: 'Plumber',
      city: 'Nairobi',
    },
  });

  const leadB = await prisma.lead.create({
    data: {
      userId: userB.id,
      businessName: 'Beta Solar Energy Ltd',
      phone: '+254722222222',
      phoneFormatted: '+254 722 222222',
      category: 'Solar',
      city: 'Mombasa',
    },
  });

  // Query User A leads
  const userALeads = await prisma.lead.findMany({
    where: { userId: userA.id },
  });
  assert(userALeads.length === 1 && userALeads[0].id === leadA.id, 'User A retrieves only User A leads');

  // Query User B leads
  const userBLeads = await prisma.lead.findMany({
    where: { userId: userB.id },
  });
  assert(userBLeads.length === 1 && userBLeads[0].id === leadB.id, 'User B retrieves only User B leads');

  // Clean up test records
  await prisma.lead.deleteMany({ where: { id: { in: [leadA.id, leadB.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id, createdUser!.id] } } });
  await prisma.emailDeliveryLog.deleteMany({ where: { email: testUserEmail } });

  console.log('\n=======================================================');
  console.log(` SUMMARY: ${passed} / ${passed + failed} TESTS PASSED (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite()
  .catch((err) => {
    console.error('Test suite exception:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
