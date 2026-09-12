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

export interface ApplicationData {
  id?: string;
  jobId?: string;
  userId?: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  applicationMethod?: "email" | "external_form" | "direct_api";
  status: "SAVED" | "PREPARING" | "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED" | "WITHDRAWN";
  resumeVersion?: string;
  coverLetterText?: string;
  appliedAt?: string | Date | null;
  followUpDate?: string | Date | null;
  recruiterEmail?: string;
  recruiterName?: string;
  salaryOffer?: string;
  checklist?: {
    tailoredResumeReady: boolean;
    coverLetterPrepared: boolean;
    portfolioLinksVerified: boolean;
    timezoneOverlapChecked: boolean;
    ratesAligned: boolean;
  };
  notes?: string;
}

export async function createOrUpdateApplicationAction(
  data: ApplicationData,
  userId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, error: "Authentication required to manage applications" };
    }

    const effectiveUserId =
      session.role === "admin" && userId ? userId : session.userId;

    const checklistJson = data.checklist ? JSON.stringify(data.checklist) : null;
    const appliedAt =
      data.status === "APPLIED" || data.status === "INTERVIEW"
        ? data.appliedAt
          ? new Date(data.appliedAt)
          : new Date()
        : null;

    // If jobId provided, verify ownership of the associated lead
    if (data.jobId) {
      const lead = await prisma.lead.findUnique({
        where: { id: data.jobId },
      });
      if (lead && lead.userId && lead.userId !== effectiveUserId && session.role !== "admin") {
        return { success: false, error: "Forbidden: You cannot modify applications for another user's lead" };
      }
    }

    let existing = null;
    if (data.id) {
      existing = await prisma.application.findUnique({ where: { id: data.id } });
    } else if (data.jobId) {
      existing = await prisma.application.findFirst({
        where: {
          jobId: data.jobId,
          ...(session.role === "admin" ? {} : { userId: effectiveUserId }),
        },
      });
    }

    if (existing) {
      if (existing.userId && existing.userId !== effectiveUserId && session.role !== "admin") {
        return { success: false, error: "Forbidden: You cannot modify this application" };
      }

      const updated = await prisma.application.update({
        where: { id: existing.id },
        data: {
          jobTitle: data.jobTitle,
          company: data.company,
          jobUrl: data.jobUrl,
          applicationMethod: data.applicationMethod || "external_form",
          status: data.status,
          resumeVersion: data.resumeVersion || undefined,
          coverLetterText: data.coverLetterText || undefined,
          appliedAt: appliedAt || undefined,
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
          recruiterEmail: data.recruiterEmail || undefined,
          recruiterName: data.recruiterName || undefined,
          salaryOffer: data.salaryOffer || undefined,
          checklistJson: checklistJson || undefined,
          notes: data.notes || undefined,
        },
      });

      // Also sync the Lead status if lead belongs to user
      if (data.jobId) {
        await prisma.lead.updateMany({
          where: {
            id: data.jobId,
            ...(session.role === "admin" ? {} : { userId: effectiveUserId }),
          },
          data: { status: data.status },
        });
      }

      safeRevalidatePath("/pipeline");
      return { success: true, data: updated };
    } else {
      const created = await prisma.application.create({
        data: {
          jobId: data.jobId || null,
          userId: effectiveUserId,
          jobTitle: data.jobTitle,
          company: data.company,
          jobUrl: data.jobUrl,
          applicationMethod: data.applicationMethod || "external_form",
          status: data.status || "SAVED",
          resumeVersion: data.resumeVersion || null,
          coverLetterText: data.coverLetterText || null,
          appliedAt,
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
          recruiterEmail: data.recruiterEmail || null,
          recruiterName: data.recruiterName || null,
          salaryOffer: data.salaryOffer || null,
          checklistJson,
          notes: data.notes || null,
        },
      });

      if (data.jobId) {
        await prisma.lead.updateMany({
          where: {
            id: data.jobId,
            ...(session.role === "admin" ? {} : { userId: effectiveUserId }),
          },
          data: { status: data.status },
        });
      }

      safeRevalidatePath("/pipeline");
      return { success: true, data: created };
    }
  } catch (error: any) {
    console.error("[ApplicationAction] Save failed:", error);
    return { success: false, error: error.message || "Failed to save application" };
  }
}

export async function fetchApplicationDetailsAction(jobId: string): Promise<{
  success: boolean;
  data?: ApplicationData | null;
  error?: string;
}> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, data: null, error: "Authentication required" };
    }

    const record = await prisma.application.findFirst({
      where: {
        jobId,
        ...(session.role === "admin" ? {} : { userId: session.userId }),
      },
    });

    if (!record) return { success: true, data: null };

    let checklist = undefined;
    if (record.checklistJson) {
      try {
        checklist = JSON.parse(record.checklistJson);
      } catch (_) {}
    }

    return {
      success: true,
      data: {
        id: record.id,
        jobId: record.jobId || undefined,
        userId: record.userId || undefined,
        jobTitle: record.jobTitle,
        company: record.company,
        jobUrl: record.jobUrl,
        applicationMethod: record.applicationMethod as any,
        status: record.status as any,
        resumeVersion: record.resumeVersion || undefined,
        coverLetterText: record.coverLetterText || undefined,
        appliedAt: record.appliedAt,
        followUpDate: record.followUpDate,
        recruiterEmail: record.recruiterEmail || undefined,
        recruiterName: record.recruiterName || undefined,
        salaryOffer: record.salaryOffer || undefined,
        checklist,
        notes: record.notes || undefined,
      },
    };
  } catch (error: any) {
    console.error("[ApplicationAction] Fetch failed:", error);
    return { success: false, data: null, error: error.message };
  }
}
