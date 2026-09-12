import { NextResponse } from "next/server";
import { aggregator } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      physical: aggregator.getPhysicalProvidersStatus(),
      online: aggregator.getOnlineProvidersStatus(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch status" },
      { status: 500 }
    );
  }
}
