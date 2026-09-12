import prisma from "@/lib/db";
import { getAuthoritativePlan } from "@/lib/kora";

export interface SubscriptionStatusResult {
  hasActiveSubscription: boolean;
  isAdmin: boolean;
  subscription: {
    id: string;
    plan: string;
    status: string;
    amount: number;
    currency: string;
    startDate: Date;
    endDate: Date;
    daysRemaining: number;
    providerReference: string;
  } | null;
}

/**
 * Check if a user has an active, unexpired subscription or administrator privilege
 */
export async function checkUserSubscription(userId: string): Promise<SubscriptionStatusResult> {
  if (!userId) {
    return {
      hasActiveSubscription: false,
      isAdmin: false,
      subscription: null,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== "active") {
      return {
        hasActiveSubscription: false,
        isAdmin: false,
        subscription: null,
      };
    }

    const isUserAdmin =
      (user.role || "").toLowerCase() === "admin" ||
      (user.role || "").toLowerCase() === "administrator" ||
      (user.role || "").toLowerCase() === "owner" ||
      (user.role || "").toLowerCase() === "superadmin";

    // Query active unexpired subscription
    const now = new Date();
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        endDate: { gt: now },
      },
      orderBy: {
        endDate: "desc",
      },
    });

    if (activeSub) {
      const daysRemaining = Math.max(
        0,
        Math.ceil((activeSub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        hasActiveSubscription: true,
        isAdmin: isUserAdmin,
        subscription: {
          id: activeSub.id,
          plan: activeSub.plan,
          status: activeSub.status,
          amount: activeSub.amount,
          currency: activeSub.currency,
          startDate: activeSub.startDate,
          endDate: activeSub.endDate,
          daysRemaining,
          providerReference: activeSub.providerReference,
        },
      };
    }

    // Admins bypass subscription requirement
    if (isUserAdmin) {
      return {
        hasActiveSubscription: true,
        isAdmin: true,
        subscription: null,
      };
    }

    return {
      hasActiveSubscription: false,
      isAdmin: false,
      subscription: null,
    };
  } catch (error) {
    console.error("[SubscriptionCheck] Error verifying subscription:", error);
    return {
      hasActiveSubscription: false,
      isAdmin: false,
      subscription: null,
    };
  }
}

/**
 * Server-side guard to strictly enforce active subscription
 */
export async function requireActiveSubscription(userId: string): Promise<{
  authorized: boolean;
  error?: string;
  status: SubscriptionStatusResult;
}> {
  const status = await checkUserSubscription(userId);

  if (!status.hasActiveSubscription) {
    return {
      authorized: false,
      error: "Active subscription required. Please subscribe to unlock unlimited lead radar discovery.",
      status,
    };
  }

  return {
    authorized: true,
    status,
  };
}

/**
 * Authoritatively activate or extend a user's subscription upon verified payment
 */
export async function activateUserSubscription(params: {
  userId: string;
  planId: string;
  providerReference: string;
  amount?: number;
  currency?: string;
  provider?: string;
}): Promise<{
  success: boolean;
  message?: string;
  subscription?: any;
  error?: string;
}> {
  try {
    const { userId, planId, providerReference } = params;

    if (!userId || !providerReference) {
      return {
        success: false,
        error: "Missing required subscription parameters (userId or providerReference).",
      };
    }

    const plan = getAuthoritativePlan(planId) || getAuthoritativePlan("monthly")!;
    const now = new Date();

    // Check if user currently has an active unexpired subscription
    const existingActive = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        endDate: { gt: now },
      },
      orderBy: {
        endDate: "desc",
      },
    });

    // If existing active subscription, extend the end date from current end date
    const baseDate = existingActive && existingActive.endDate > now ? existingActive.endDate : now;
    const endDate = new Date(baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    const startDate = existingActive ? existingActive.startDate : now;

    const sub = await prisma.subscription.upsert({
      where: { providerReference },
      create: {
        userId,
        plan: plan.id,
        status: "ACTIVE",
        provider: params.provider || "kora",
        providerReference,
        amount: plan.priceUsd,
        currency: params.currency || "USD",
        startDate,
        endDate,
      },
      update: {
        status: "ACTIVE",
        plan: plan.id,
        endDate,
        updatedAt: now,
      },
    });

    console.log("[SubscriptionActivated] User " + userId + " subscribed to " + plan.id + " until " + endDate.toISOString());

    return {
      success: true,
      message: "Successfully activated " + plan.name + ". Valid until " + endDate.toLocaleDateString() + ".",
      subscription: sub,
    };
  } catch (err: any) {
    console.error("[SubscriptionActivationError]:", err);
    return {
      success: false,
      error: err.message || "Failed to record subscription.",
    };
  }
}
