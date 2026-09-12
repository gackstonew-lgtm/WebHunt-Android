import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getUserSubscriptionAction, getPaymentPlansAction } from "@/app/actions/payments";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plansData = await getPaymentPlansAction();
    const session = await getCurrentSession();
    const subData = session?.userId ? await getUserSubscriptionAction() : null;

    return NextResponse.json({
      success: true,
      plans: plansData.plans,
      subscription: subData?.subscriptionStatus || {
        hasActiveSubscription: false,
        isAdmin: false,
        subscription: null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch subscription info" },
      { status: 500 }
    );
  }
}
