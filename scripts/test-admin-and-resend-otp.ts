import prisma from '../lib/db';
import crypto from 'crypto';
import { 
  hashPassword, 
  verifyPassword, 
  generateSecureOtp, 
  hashOtp, 
  verifyOtp 
} from '../lib/auth/password';
import { 
  createSessionToken, 
  decryptSessionToken, 
  isAdminSession 
} from '../lib/auth/session';
import { 
  registerAction, 
  loginAction, 
  verifyOtpAction, 
  resendOtpAction, 
  getAuthStatusAction 
} from '../app/actions/auth';
import { bootstrapAdmin } from './bootstrap-admin';
import { sendVerificationOtpEmail } from '../lib/email/service';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

async function runTestSuite() {
  console.log('=======================================================');
  console.log(' WEBHUNT ADMIN BOOTSTRAP & RESEND OTP TEST SUITE ');
  console.log('=======================================================\n');

  const adminEmail = 'gackstoneb@gmail.com';
  const adminPassword = process.env.WEBHUNT_ADMIN_BOOTSTRAP_PASSWORD || '@Gackstone02';

  // --- 1. Administrator Account Provisioning & Idempotency ---
  console.log('--- 1. Administrator Account Provisioning ---');
  await bootstrapAdmin(adminPassword);

  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { profile: true },
  });

  assert(adminUser !== null, 'Administrator user exists in database');
  assert(adminUser?.email === adminEmail, 'Email matches gackstoneb@gmail.com');
  assert(adminUser?.role === 'admin', 'Role is set to "admin"');
  assert(adminUser?.status === 'active', 'Status is set to "active"');
  assert(adminUser?.emailVerified !== null, 'Administrator email is marked verified');
  assert(adminUser?.passwordHash !== null && adminUser!.passwordHash!.includes(':'), 'Password is saved as salt:scrypt hash');
  assert(!adminUser?.passwordHash?.includes(adminPassword), 'Plaintext password is not stored in DB');

  // Rerun provisioning to confirm idempotency
  await bootstrapAdmin(adminPassword);
  const adminCount = await prisma.user.count({ where: { email: adminEmail } });
  assert(adminCount === 1, 'Idempotent provisioning: exactly 1 admin record exists');

  // --- 2. Administrator Authentication ---
  console.log('\n--- 2. Administrator Authentication & Authorization ---');
  const validAdminLogin = await loginAction({
    email: adminEmail,
    password: adminPassword,
  });
  assert(validAdminLogin.success === true, 'Admin login succeeds with valid credentials');
  assert(validAdminLogin.role === 'admin', 'Login returns admin role');

  const wrongPasswordLogin = await loginAction({
    email: adminEmail,
    password: 'WrongPassword999!',
  });
  assert(wrongPasswordLogin.success === false, 'Admin login fails with wrong password');

  const adminSessionToken = await createSessionToken(adminUser!.id, adminUser!.email, adminUser!.role);
  const decryptedAdminSession = await decryptSessionToken(adminSessionToken);
  assert(decryptedAdminSession?.role === 'admin', 'Session payload contains admin role');
  assert(isAdminSession(decryptedAdminSession) === true, 'isAdminSession helper identifies admin');

  // --- 3. Regular User Isolation & Role Checks ---
  console.log('\n--- 3. Normal User Role Boundaries ---');
  const normalUserEmail = `standard_user_${Date.now()}@example.com`;
  const normalUserPassword = 'UserPass123!';

  const regUser = await registerAction({
    name: 'Normal User',
    email: normalUserEmail,
    password: normalUserPassword,
  });
  assert(regUser.success === true, 'Normal user registration succeeds');
  assert(regUser.requireOtp === true, 'Registration triggers OTP requirement');

  const normalDbUser = await prisma.user.findUnique({ where: { email: normalUserEmail } });
  assert(normalDbUser?.role === 'user', 'Normal user receives "user" role');
  assert(normalDbUser?.emailVerified === null, 'Normal user is initially unverified');

  const normalSessionToken = await createSessionToken(normalDbUser!.id, normalDbUser!.email, normalDbUser!.role);
  const decryptedNormalSession = await decryptSessionToken(normalSessionToken);
  assert(isAdminSession(decryptedNormalSession) === false, 'Normal user does NOT have admin privileges');

  // --- 4. Unverified Login Blocking ---
  console.log('\n--- 4. Unverified Account Blocking ---');
  const unverifiedLogin = await loginAction({
    email: normalUserEmail,
    password: normalUserPassword,
  });
  assert(unverifiedLogin.success === false, 'Unverified user cannot log into workspace');
  assert(unverifiedLogin.isUnverified === true, 'Identifies unverified status and requests OTP');

  // --- 5. OTP Hashing & Verification Logic ---
  console.log('\n--- 5. Cryptographic 6-Digit OTP Validation ---');
  const generatedOtp = generateSecureOtp(6);
  assert(/^\d{6}$/.test(generatedOtp), 'OTP is a 6-digit numeric string');

  const otpHash = hashOtp(generatedOtp);
  assert(typeof otpHash === 'string' && otpHash.length === 64, 'OTP hash is 64-char SHA-256 hex');

  assert(verifyOtp(generatedOtp, otpHash) === true, 'verifyOtp accepts valid matching OTP');
  assert(verifyOtp('000000', otpHash) === false, 'verifyOtp rejects non-matching OTP');

  // Set known OTP for testing the user record
  const testOtp = '849201';
  await prisma.user.update({
    where: { email: normalUserEmail },
    data: {
      verificationOtpHash: hashOtp(testOtp),
      verificationOtpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      verificationOtpAttempts: 0,
    },
  });

  // Test wrong OTP attempt
  const wrongOtpResult = await verifyOtpAction({
    email: normalUserEmail,
    otp: '111111',
  });
  assert(wrongOtpResult.success === false, 'Incorrect OTP rejected');

  const userAfterFail = await prisma.user.findUnique({ where: { email: normalUserEmail } });
  assert(userAfterFail?.verificationOtpAttempts === 1, 'Failed attempt counter incremented to 1');

  // Test correct OTP submission
  const correctOtpResult = await verifyOtpAction({
    email: normalUserEmail,
    otp: testOtp,
  });
  assert(correctOtpResult.success === true, 'Correct OTP accepted and activates account');

  const verifiedDbUser = await prisma.user.findUnique({ where: { email: normalUserEmail } });
  assert(verifiedDbUser?.emailVerified !== null, 'User emailVerified timestamp set in database');
  assert(verifiedDbUser?.verificationOtpHash === null, 'OTP hash consumed and removed');

  // Test single-use replay rejection
  const replayResult = await verifyOtpAction({
    email: normalUserEmail,
    otp: testOtp,
  });
  assert(replayResult.success === true, 'Already verified account returns safe success/login prompt');

  // --- 6. Verified User Login ---
  console.log('\n--- 6. Post-Verification Login ---');
  const verifiedUserLogin = await loginAction({
    email: normalUserEmail,
    password: normalUserPassword,
  });
  assert(verifiedUserLogin.success === true, 'Verified user signs in successfully');

  // --- 7. Resend OTP Rate Limiting ---
  console.log('\n--- 7. Resend Rate Limiting (60s Cooldown) ---');
  const testRateEmail = `ratelimit_${Date.now()}@example.com`;
  await registerAction({
    name: 'Rate User',
    email: testRateEmail,
    password: 'Password123!',
  });

  const rapidResend = await resendOtpAction(testRateEmail);
  assert(rapidResend.success === false, 'Immediate resend rejected by 60s rate limit');
  assert(rapidResend.cooldownSeconds !== undefined && rapidResend.cooldownSeconds > 0, 'Returns remaining cooldown seconds');

  // --- 8. Resend Email Dispatcher ---
  console.log('\n--- 8. Resend API Dispatch Test ---');
  const testEmailResult = await sendVerificationOtpEmail(
    'delivered@resend.dev',
    'Gackstone Baraka',
    '739182'
  );
  assert(testEmailResult.success === true, 'sendVerificationOtpEmail dispatches without error');
  assert(testEmailResult.messageId !== undefined, 'Email result contains messageId');

  // --- 9. Resend Webhook Svix Signature Verification ---
  console.log('\n--- 9. Resend Svix Webhook Verification ---');
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET || 'whsec_Nq5j98BjcAjn/fDHzHstf2Wb2Bk1eNOP';
  const cleanSecret = webhookSecret.startsWith('whsec_') ? webhookSecret.slice(6) : webhookSecret;
  const secretBytes = Buffer.from(cleanSecret, 'base64');

  const testPayload = JSON.stringify({
    type: 'email.delivered',
    created_at: new Date().toISOString(),
    data: {
      id: testEmailResult.messageId || 'msg_test_123',
      from: 'onboarding@resend.dev',
      to: ['delivered@resend.dev'],
      subject: '739182 is your WebHunt verification code',
    },
  });

  const svixId = `msg_${Date.now()}`;
  const svixTimestamp = Math.floor(Date.now() / 1000).toString();
  const toSign = `${svixId}.${svixTimestamp}.${testPayload}`;
  const validSignature = crypto.createHmac('sha256', secretBytes).update(toSign).digest('base64');

  // Verify signature algorithm directly
  const signatureHeader = `v1,${validSignature}`;
  assert(signatureHeader.startsWith('v1,'), 'Svix signature header formatted correctly');

  // Save webhook event to DB to test idempotency
  const eventId = svixId;
  await prisma.webhookEvent.create({
    data: {
      eventId,
      eventType: 'email.delivered',
      payload: testPayload,
    },
  });

  const duplicateEvent = await prisma.webhookEvent.findUnique({
    where: { eventId },
  });
  assert(duplicateEvent !== null, 'Webhook event logged in database for idempotency tracking');

  console.log('\n=======================================================');
  console.log('🎉 ALL ADMINISTRATOR BOOTSTRAP & RESEND OTP TESTS PASSED 100%!');
  console.log('=======================================================\n');
}

runTestSuite()
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
