"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/session";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // In CLI test runners outside request context, static generation store is not active
  }
}

export async function saveProposalDraftAction(params: {
  leadId?: string;
  userId?: string;
  title: string;
  templateType: string;
  subject: string;
  greeting?: string;
  body: string;
  callToAction: string;
  fullText: string;
  variablesJson?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, error: "Authentication required to save proposal draft" };
    }

    const effectiveUserId =
      session.role === "admin" && params.userId ? params.userId : session.userId;

    if (params.leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: params.leadId },
      });
      if (lead && lead.userId && lead.userId !== effectiveUserId && session.role !== "admin") {
        return { success: false, error: "Forbidden: You cannot modify proposal drafts for another user's lead" };
      }
    }

    const draft = await prisma.proposalDraft.create({
      data: {
        leadId: params.leadId || null,
        userId: effectiveUserId,
        title: params.title,
        templateType: params.templateType,
        subject: params.subject,
        greeting: params.greeting || "Hi,",
        body: params.body,
        callToAction: params.callToAction,
        fullText: params.fullText,
        variablesJson: params.variablesJson || null,
        status: "DRAFT",
      },
    });

    safeRevalidatePath("/pipeline");
    return { success: true, data: draft };
  } catch (error: any) {
    console.error("[OutreachAction] Save draft failed:", error);
    return { success: false, error: error.message || "Failed to save proposal draft" };
  }
}

export async function fetchProposalDraftsAction(leadId: string): Promise<{
  success: boolean;
  data: any[];
  error?: string;
}> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, data: [], error: "Authentication required" };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });
    if (lead && lead.userId && lead.userId !== session.userId && session.role !== "admin") {
      return { success: false, data: [], error: "Forbidden: Access denied" };
    }

    const drafts = await prisma.proposalDraft.findMany({
      where: {
        leadId,
        ...(session.role === "admin" ? {} : { userId: session.userId }),
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: drafts };
  } catch (error: any) {
    console.error("[OutreachAction] Fetch drafts failed:", error);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Checks if a recipient has already received outreach in the last N days
 */
export async function checkDuplicateOutreachAction(
  recipient: string,
  channel: "email" | "whatsapp" | "call" = "email",
  cooldownDays: number = 7
): Promise<{
  isDuplicate: boolean;
  lastContactedAt?: string | null;
  messageCount: number;
}> {
  if (!recipient || recipient.trim() === "") {
    return { isDuplicate: false, messageCount: 0 };
  }

  try {
    const session = await getCurrentSession();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cooldownDays);

    const messages = await prisma.outreachMessage.findMany({
      where: {
        recipient: recipient.trim(),
        channel,
        sentAt: { gte: cutoffDate },
        ...(session ? (session.role === "admin" ? {} : { userId: session.userId }) : {}),
      },
      orderBy: { sentAt: "desc" },
    });

    if (messages.length > 0) {
      return {
        isDuplicate: true,
        lastContactedAt: messages[0].sentAt.toISOString(),
        messageCount: messages.length,
      };
    }

    return { isDuplicate: false, messageCount: 0 };
  } catch (error: any) {
    console.error("[OutreachAction] Duplicate check failed:", error);
    return { isDuplicate: false, messageCount: 0 };
  }
}

export async function recordOutreachMessageAction(params: {
  leadId?: string;
  userId?: string;
  channel: "email" | "whatsapp" | "call";
  recipient: string;
  subject?: string;
  messageBody: string;
  externalMessageId?: string;
  status?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, error: "Authentication required to record outreach message" };
    }

    const effectiveUserId =
      session.role === "admin" && params.userId ? params.userId : session.userId;

    if (params.leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: params.leadId },
      });
      if (lead && lead.userId && lead.userId !== effectiveUserId && session.role !== "admin") {
        return { success: false, error: "Forbidden: You cannot modify outreach for another user's lead" };
      }
    }

    const record = await prisma.outreachMessage.create({
      data: {
        leadId: params.leadId || null,
        userId: effectiveUserId,
        channel: params.channel,
        recipient: params.recipient,
        subject: params.subject || null,
        messageBody: params.messageBody,
        externalMessageId: params.externalMessageId || null,
        status: params.status || "SENT",
        sentAt: new Date(),
      },
    });

    // Also update lead's contacted timestamp & status if leadId is present
    if (params.leadId) {
      await prisma.lead.updateMany({
        where: {
          id: params.leadId,
          ...(session.role === "admin" ? {} : { userId: effectiveUserId }),
        },
        data: {
          status: "CONTACTED",
          contactedAt: new Date(),
        },
      });
    }

    safeRevalidatePath("/pipeline");
    return { success: true, data: record };
  } catch (error: any) {
    console.error("[OutreachAction] Record outreach failed:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchLeadOutreachHistoryAction(leadId: string): Promise<{
  success: boolean;
  data: any[];
  error?: string;
}> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, data: [], error: "Authentication required" };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });
    if (lead && lead.userId && lead.userId !== session.userId && session.role !== "admin") {
      return { success: false, data: [], error: "Forbidden: Access denied" };
    }

    const records = await prisma.outreachMessage.findMany({
      where: {
        leadId,
        ...(session.role === "admin" ? {} : { userId: session.userId }),
      },
      orderBy: { sentAt: "desc" },
    });
    return { success: true, data: records };
  } catch (error: any) {
    console.error("[OutreachAction] Fetch history failed:", error);
    return { success: false, data: [], error: error.message };
  }
}
