import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { updateLeadStatusAction, updateLeadNotesAction, deleteLeadAction } from "@/app/actions/leads";
import { PipelineStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const leadId = params.id;
    const body = await request.json();

    if (body.status) {
      const res = await updateLeadStatusAction(leadId, body.status as PipelineStatus);
      if (!res.success) return NextResponse.json(res, { status: 400 });
    }

    if (body.notes !== undefined || body.estimatedValue !== undefined) {
      const res = await updateLeadNotesAction(leadId, body.notes || "", body.estimatedValue);
      if (!res.success) return NextResponse.json(res, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Lead updated" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const leadId = params.id;
    const res = await deleteLeadAction(leadId);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete lead" },
      { status: 500 }
    );
  }
}
