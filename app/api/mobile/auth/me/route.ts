import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { checkUserSubscription } from "@/lib/auth/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "User not found" },
        { status: 404 }
      );
    }

    const subStatus = await checkUserSubscription(user.id);

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        isVerified: !!user.emailVerified,
        profile: user.profile,
      },
      subscription: subStatus,
    });
  } catch (error: any) {
    console.error("[MobileAuth] Me error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch auth status" },
      { status: 500 }
    );
  }
}
