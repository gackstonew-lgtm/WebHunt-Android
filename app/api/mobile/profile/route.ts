import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getUserProfileAction, saveUserProfileAction, UserProfileData } from "@/app/actions/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const res = await getUserProfileAction(session.userId);
    if (res.success && res.data) {
      if (!res.data.email) res.data.email = session.email;
      if (!res.data.fullName) res.data.fullName = session.email.split("@")[0];
    }
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: UserProfileData = await request.json();
    const res = await saveUserProfileAction(body, session.userId);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
