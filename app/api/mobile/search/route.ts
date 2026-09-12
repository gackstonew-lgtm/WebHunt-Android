import { NextResponse } from "next/server";
import { aggregator } from "@/lib/providers";
import { SearchParams } from "@/lib/types";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getCurrentSession } from "@/lib/auth/session";
import { checkUserSubscription } from "@/lib/auth/subscription";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const headerList = headers();
    const forwarded = headerList.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const rl = checkRateLimit(`search:${ip}`, 30, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please wait ${rl.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        {
          success: false,
          requireAuth: true,
          error: "Authentication required. Please sign in or create an account to launch lead radar scans.",
        },
        { status: 401 }
      );
    }

    const subCheck = await checkUserSubscription(session.userId);
    if (!subCheck.hasActiveSubscription) {
      return NextResponse.json(
        {
          success: false,
          requireSubscription: true,
          error: "Active subscription required. Please choose a subscription plan (Monthly $50 or Annual $200) to launch Lead Radar scans.",
        },
        { status: 402 }
      );
    }

    const params: SearchParams = await request.json();

    if (params.mode === "physical") {
      if (!params.niche || params.niche.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Please enter an industry or niche." },
          { status: 400 }
        );
      }
      if (!params.country || params.country.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Please select a target country." },
          { status: 400 }
        );
      }
    } else {
      if (!params.query || params.query.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Please enter a job keyword or role." },
          { status: 400 }
        );
      }
    }

    const result = await aggregator.search(params);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("[MobileSearch] Search failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute search" },
      { status: 500 }
    );
  }
}
