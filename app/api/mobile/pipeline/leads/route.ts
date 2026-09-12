import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { fetchPipelineLeadsAction, saveLeadToPipelineAction, bulkSaveLeadsAction } from "@/app/actions/leads";
import { LeadItem } from "@/lib/types";

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

    const res = await fetchPipelineLeadsAction(session.userId);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (Array.isArray(body.leads)) {
      const res = await bulkSaveLeadsAction(body.leads as LeadItem[], session.userId);
      return NextResponse.json(res);
    } else if (body.lead) {
      const res = await saveLeadToPipelineAction(body.lead as LeadItem, session.userId);
      return NextResponse.json(res);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid payload. Provide 'lead' or 'leads'." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save lead(s)" },
      { status: 500 }
    );
  }
}
