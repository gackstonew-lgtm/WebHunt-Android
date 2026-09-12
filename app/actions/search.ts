"use server";

import { aggregator } from "@/lib/providers";
import { SearchParams, SearchResult } from "@/lib/types";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getCurrentSession } from "@/lib/auth/session";
import { checkUserSubscription } from "@/lib/auth/subscription";
import { headers } from "next/headers";

export async function executeSearchAction(params: SearchParams): Promise<{
  success: boolean;
  data?: SearchResult;
  error?: string;
  requireAuth?: boolean;
  requireSubscription?: boolean;
  returnTo?: string;
}> {
  try {
    const headerList = headers();
    const forwarded = headerList.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const rl = checkRateLimit(`search:${ip}`, 30, 60);
    if (!rl.allowed) {
      return {
        success: false,
        error: `Search rate limit exceeded. Please wait ${rl.retryAfterSeconds} seconds before searching again.`,
      };
    }

    // 1. Enforce Server-Side Authentication
    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return {
        success: false,
        requireAuth: true,
        error: "Authentication required. Please sign in or create an account to launch lead radar scans.",
        returnTo: params.mode || "physical",
      };
    }

    // 2. Enforce Authoritative Server-Side Subscription Guard
    const subCheck = await checkUserSubscription(session.userId);
    if (!subCheck.hasActiveSubscription) {
      return {
        success: false,
        requireSubscription: true,
        error: "Active subscription required. Please choose a subscription plan (Monthly $50 or Annual $200) to launch Lead Radar scans.",
        returnTo: params.mode || "physical",
      };
    }

    if (params.mode === "physical") {
      if (!params.niche || params.niche.trim().length === 0) {
        return { success: false, error: "Please enter an industry or niche (e.g. plumbers, auto repair, barbers)." };
      }
      if (!params.country || params.country.trim().length === 0) {
        return { success: false, error: "Please select a target country." };
      }
    } else {
      if (!params.query || params.query.trim().length === 0) {
        return { success: false, error: "Please enter a job keyword or tech stack (e.g. React, Next.js, WordPress)." };
      }
    }

    const result = await aggregator.search(params);

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("[SearchAction] Search failed:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred while executing the search radar.",
    };
  }
}

export async function getProviderStatusesAction() {
  return {
    physical: aggregator.getPhysicalProvidersStatus(),
    online: aggregator.getOnlineProvidersStatus(),
  };
}
