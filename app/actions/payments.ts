"use server";

import { 
  initializeKoraPayment, 
  verifyKoraTransaction, 
  getKoraPublicConfig, 
  getAuthoritativePlan,
  KORA_PAYMENT_PLANS,
  PaymentPlan,
  KoraInitializationResponse,
  KoraVerificationResponse
} from "@/lib/kora";
import { getAuthStatusAction } from "./auth";
import { getCurrentSession } from "@/lib/auth/session";
import { checkUserSubscription, activateUserSubscription, SubscriptionStatusResult } from "@/lib/auth/subscription";
import { revalidatePath } from "next/cache";

export interface InitializePaymentActionParams {
  planId: "monthly" | "annual" | string;
  currency?: "KES" | "USD" | "NGN" | "GHS" | string;
  customerEmail?: string;
  customerName?: string;
  narration?: string;
  returnTo?: string;
  channels?: Array<"card" | "mobile_money" | "bank_transfer">;
}

export async function getPaymentPlansAction(): Promise<{
  success: boolean;
  plans: PaymentPlan[];
  config: ReturnType<typeof getKoraPublicConfig>;
}> {
  return {
    success: true,
    plans: KORA_PAYMENT_PLANS,
    config: getKoraPublicConfig(),
  };
}

export async function getUserSubscriptionAction(): Promise<{
  isAuthenticated: boolean;
  user: { id: string; email: string; name?: string | null; role: string } | null;
  subscriptionStatus: SubscriptionStatusResult;
}> {
  const session = await getCurrentSession();
  if (!session || !session.userId) {
    return {
      isAuthenticated: false,
      user: null,
      subscriptionStatus: {
        hasActiveSubscription: false,
        isAdmin: false,
        subscription: null,
      },
    };
  }

  const subStatus = await checkUserSubscription(session.userId);

  return {
    isAuthenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      role: session.role || "user",
    },
    subscriptionStatus: subStatus,
  };
}

export async function initializePaymentAction(
  params: InitializePaymentActionParams
): Promise<KoraInitializationResponse> {
  try {
    const auth = await getAuthStatusAction();
    const plan = getAuthoritativePlan(params.planId) || KORA_PAYMENT_PLANS[0];
    const currency = (params.currency || "USD").toUpperCase();

    // Authoritatively resolve amount from server plan definition (never trust client amount)
    const authoritativeAmount = currency === "KES" ? plan.priceKes : plan.priceUsd;
    const userEmail = params.customerEmail || auth.user?.email || "customer@webhunt.dev";
    const userName = params.customerName || auth.user?.name || "WebHunt Lead Hunter";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://webhunt-delta.vercel.app";
    const returnParam = params.returnTo ? encodeURIComponent(params.returnTo) : "";
    const redirectUrl = appUrl + "/subscription?payment=success&returnTo=" + returnParam;

    const res = await initializeKoraPayment({
      amount: authoritativeAmount,
      currency,
      customer: {
        email: userEmail,
        name: userName,
      },
      narration: "WebHunt " + plan.name + " (" + currency + " " + authoritativeAmount + ")",
      redirectUrl,
      channels: params.channels,
      metadata: {
        userId: auth.user?.id || null,
        userEmail,
        planId: plan.id,
        returnTo: params.returnTo || "",
      },
    });

    return res;
  } catch (error: any) {
    return {
      status: false,
      message: error.message || "Failed to initialize payment",
      error: error.message,
    };
  }
}

export async function verifyPaymentAction(
  reference: string
): Promise<KoraVerificationResponse & { activated?: boolean; subscription?: any }> {
  try {
    const res = await verifyKoraTransaction(reference);

    if (res.status && res.data?.status === "success") {
      const metadata = res.data.metadata || {};
      let targetUserId = metadata.userId;

      if (!targetUserId) {
        const session = await getCurrentSession();
        targetUserId = session?.userId;
      }

      if (targetUserId) {
        const planId = metadata.planId || "monthly";
        const activation = await activateUserSubscription({
          userId: targetUserId,
          planId,
          providerReference: reference,
          amount: res.data.amount,
          currency: res.data.currency,
          provider: "kora",
        });

        try {
          revalidatePath("/");
          revalidatePath("/subscription");
          revalidatePath("/pipeline");
        } catch {
          // ignore cache revalidation outside request context
        }

        return {
          ...res,
          activated: activation.success,
          subscription: activation.subscription,
        };
      }
    }

    return res;
  } catch (error: any) {
    return {
      status: false,
      message: error.message || "Failed to verify transaction",
      error: error.message,
    };
  }
}
