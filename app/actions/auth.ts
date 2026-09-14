"use server";

import prisma from "@/lib/db";
import { 
  hashPassword, 
  verifyPassword, 
  validatePasswordStrength, 
  generateSecureToken
} from "@/lib/auth/password";
import { 
  setSessionCookie, 
  clearSessionCookie, 
  getCurrentSession,
  isAdminSession
} from "@/lib/auth/session";
import { sendPasswordResetEmail } from "@/lib/email/service";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { revalidatePath } from "next/cache";

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // In CLI test scripts outside request context, static generation store is not active
  }
}

/**
 * Register a new user account — immediately activated, no email verification required.
 */
export async function registerAction(formData: {
  name?: string;
  email: string;
  password: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  requireOtp?: boolean;
  requireVerification?: boolean;
  email?: string;
}> {
  try {
    const rawEmail = formData.email || "";
    const email = rawEmail.toLowerCase().trim();
    const name = (formData.name || "").trim();
    const password = formData.password || "";

    if (!email || !EMAIL_REGEX.test(email)) {
      return { success: false, error: "Please provide a valid email address." };
    }

    const regLimit = checkRateLimit(`register_${email}`, 5, 60);
    if (!regLimit.allowed) {
      return {
        success: false,
        error: `Too many registration attempts. Please wait ${regLimit.retryAfterSeconds} second(s).`,
      };
    }

    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.isValid) {
      return { success: false, error: strengthCheck.message || "Password does not meet security requirements." };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return {
          success: false,
          error: "An account with this email address already exists. Please sign in.",
        };
      } else {
        // Previously unverified account: update password and immediately activate
        const newPasswordHash = await hashPassword(password);

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: name || existingUser.name,
            passwordHash: newPasswordHash,
            emailVerified: new Date(),
            verificationOtpHash: null,
            verificationOtpExpiry: null,
            verificationOtpAttempts: 0,
            verificationToken: null,
            verificationTokenExpiry: null,
          },
        });

        // Establish authenticated session immediately
        await setSessionCookie(existingUser.id, existingUser.email, existingUser.role);

        safeRevalidatePath("/");
        safeRevalidatePath("/pipeline");

        return {
          success: true,
          email,
          message: "Account activated successfully. Welcome back to WebHunt.",
        };
      }
    }

    // New user registration — immediately verified, no OTP required
    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        role: "user",
        status: "active",
        emailVerified: new Date(),
        profile: {
          create: {
            fullName: name || email.split("@")[0],
            professionalTitle: "",
            skillsJson: JSON.stringify([]),
            currency: "USD",
            timezone: "Africa/Nairobi (EAT, UTC+3)",
            email: email,
          },
        },
      },
    });

    // Establish authenticated session immediately
    await setSessionCookie(newUser.id, newUser.email, newUser.role);

    safeRevalidatePath("/");
    safeRevalidatePath("/pipeline");

    return {
      success: true,
      email,
      message: "Account created successfully. Welcome to WebHunt.",
    };
  } catch (error: any) {
    console.error("[AuthAction] Registration failed:", error);
    return {
      success: false,
      error: error.message || "Failed to create account. Please try again.",
    };
  }
}

/**
 * verifyOtpAction — Email verification is no longer required.
 * This stub exists for backward compatibility with any existing imports.
 * All newly registered users are immediately activated; this function
 * simply establishes a session for any valid account.
 */
export async function verifyOtpAction(params: {
  email: string;
  otp: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  isExpired?: boolean;
  isLocked?: boolean;
}> {
  try {
    const email = (params.email || "").toLowerCase().trim();
    if (!email) {
      return { success: false, error: "Email address is required." };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: "Account not found." };
    }

    // If account exists, establish a session (verification no longer required)
    await setSessionCookie(user.id, user.email, user.role);
    safeRevalidatePath("/");

    return {
      success: true,
      message: "Account verified. Redirecting to workspace...",
    };
  } catch (error: any) {
    console.error("[AuthAction] verifyOtpAction (stub) error:", error);
    return { success: false, error: "An error occurred. Please sign in directly." };
  }
}


/**
 * resendOtpAction — Email verification is no longer required.
 * This stub exists for backward compatibility with any existing imports.
 */
export async function resendOtpAction(email: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  cooldownSeconds?: number;
}> {
  // Email verification has been removed; this is a no-op stub.
  return {
    success: true,
    message: "Email verification is no longer required. Please sign in directly.",
  };
}


/**
 * Sign in an existing user with verified credentials
 */
export async function loginAction(formData: {
  email: string;
  password: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  isUnverified?: boolean;
  email?: string;
  role?: string;
}> {
  try {
    const rawEmail = formData.email || "";
    const email = rawEmail.toLowerCase().trim();
    const password = formData.password || "";

    if (!email || !password) {
      return { success: false, error: "Please provide both email and password." };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "Invalid email or password." };
    }

    if (user.status !== "active") {
      return { success: false, error: "Your account is suspended or inactive. Please contact support." };
    }

    // Check account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (1000 * 60));
      return {
        success: false,
        error: `Account is temporarily locked due to failed attempts. Please try again in ${waitMinutes} minute(s).`,
      };
    }

    // Verify password
    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockoutUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockoutUntil,
        },
      });

      return { success: false, error: "Invalid email or password." };
    }

    // Reset login attempt counters on successful sign-in
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Create session cookie with role
    await setSessionCookie(user.id, user.email, user.role);

    safeRevalidatePath("/");
    safeRevalidatePath("/pipeline");
    safeRevalidatePath("/searches");

    return { success: true, role: user.role };
  } catch (error: any) {
    console.error("[AuthAction] Login failed:", error);
    return { success: false, error: "An error occurred while signing in. Please try again." };
  }
}

/**
 * verifyEmailAction — Email verification is no longer required.
 * This stub exists for backward compatibility with any existing imports.
 * Visiting /auth/verify will simply redirect to the dashboard.
 */
export async function verifyEmailAction(token: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  // Email verification has been removed; always return success.
  return {
    success: true,
    message: "Account is active. Redirecting to workspace...",
  };
}


/**
 * Backward-compatible token resend
 */
export async function resendVerificationAction(email: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const result = await resendOtpAction(email);
  return {
    success: result.success,
    message: result.message,
    error: result.error,
  };
}

/**
 * Request a password reset link
 */
export async function requestPasswordResetAction(email: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const resetLimit = checkRateLimit(`reset_${cleanEmail}`, 3, 900); // Max 3 per 15 minutes
    if (!resetLimit.allowed) {
      return {
        success: false,
        error: `Too many password reset requests. Please wait ${resetLimit.retryAfterSeconds} second(s) before trying again.`,
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (user) {
      const resetToken = generateSecureToken(32);
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      await sendPasswordResetEmail(user.email, user.name || "WebHunt User", resetToken);
    }

    return {
      success: true,
      message: "If an active account exists with that email, instructions to reset your password have been sent.",
    };
  } catch (error: any) {
    console.error("[AuthAction] Request password reset failed:", error);
    return { success: false, error: "Failed to process password reset request." };
  }
}

/**
 * Reset user password with token
 */
export async function resetPasswordAction(
  token: string,
  newPassword: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!token || token.trim() === "") {
      return { success: false, error: "Missing password reset token." };
    }

    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.isValid) {
      return { success: false, error: strengthCheck.message || "Password does not meet security requirements." };
    }

    const user = await prisma.user.findUnique({
      where: { resetToken: token.trim() },
    });

    if (!user) {
      return {
        success: false,
        error: "This password reset link is invalid or has already been used.",
      };
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      return {
        success: false,
        error: "This password reset link has expired. Please request a new one.",
      };
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    return {
      success: true,
      message: "Password reset successful! You can now sign in with your new password.",
    };
  } catch (error: any) {
    console.error("[AuthAction] Reset password failed:", error);
    return { success: false, error: "Failed to reset password. Please try again." };
  }
}

/**
 * Sign out the current user session
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  await clearSessionCookie();
  safeRevalidatePath("/");
  safeRevalidatePath("/pipeline");
  safeRevalidatePath("/searches");
  return { success: true };
}

/**
 * Get current session and user profile status
 */
export async function getAuthStatusAction(): Promise<{
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    status: string;
    isVerified: boolean;
  } | null;
}> {
  try {
    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return { isAuthenticated: false, isAdmin: false, user: null };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return { isAuthenticated: false, isAdmin: false, user: null };
    }

    const isUserAdmin = isAdminSession(session) || (user.role || '').toLowerCase() === 'admin';

    return {
      isAuthenticated: true,
      isAdmin: isUserAdmin,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        status: user.status || 'active',
        isVerified: !!user.emailVerified,
      },
    };
  } catch (err) {
    return { isAuthenticated: false, isAdmin: false, user: null };
  }
}

/**
 * Server-side authorization guard for administrative actions
 */
export async function requireAdminSessionAction(): Promise<{
  isAuthorized: boolean;
  userId?: string;
  error?: string;
}> {
  const session = await getCurrentSession();
  if (!session || !session.userId) {
    return { isAuthorized: false, error: "Authentication required." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, status: true },
  });

  if (!user || user.status !== 'active') {
    return { isAuthorized: false, error: "User account is suspended or inactive." };
  }

  const role = (user.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'administrator' && role !== 'owner' && role !== 'superadmin') {
    return { isAuthorized: false, error: "Access denied. Administrator privileges required." };
  }

  return { isAuthorized: true, userId: session.userId };
}
