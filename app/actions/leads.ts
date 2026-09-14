"use server";

import prisma from "@/lib/db";
import { LeadItem, OnlineJobLead, PhysicalLead, PipelineStatus, SocialProfiles, EnrichedLeadContacts, RemoteType, VerificationStatus, WebsiteConfidence } from "@/lib/types";
import { Lead } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/session";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // In CLI test runners outside request context, static generation store is not active
  }
}

export async function fetchPipelineLeadsAction(userId?: string): Promise<{
  success: boolean;
  data?: LeadItem[];
  error?: string;
}> {
  try {
    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return { success: false, data: [], error: "Authentication required to access lead pipeline." };
    }

    const isAdmin = session.role === "admin" || session.role === "administrator";
    const targetUserId = (isAdmin && userId) ? userId : session.userId;

    const records = await prisma.lead.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
    });

    const leads: LeadItem[] = records.map((rec) => {
      const isOnline = rec.pipelineType === "job_application" || rec.sourceType === "job_board" || !!rec.sourceProvider.match(/(remotive|arbeitnow|himalayas|weworkremotely|jobspresso|remoteok|africa)/i);

      let socialProfiles: SocialProfiles = {};
      if (rec.facebook || rec.instagram || rec.linkedin || rec.twitter) {
        socialProfiles = {
          facebook: rec.facebook,
          instagram: rec.instagram,
          linkedin: rec.linkedin,
          twitter: rec.twitter,
        };
      }

      let parsedEnrichment: EnrichedLeadContacts | undefined = undefined;
      if (rec.enrichmentJson) {
        try {
          parsedEnrichment = JSON.parse(rec.enrichmentJson) as EnrichedLeadContacts;
        } catch (_) {}
      }

      if (isOnline) {
        const jobLead: OnlineJobLead = {
          id: rec.id,
          type: "online",
          title: rec.businessName.includes(" @ ") ? rec.businessName.split(" @ ")[0] : rec.businessName,
          company: rec.businessName.includes(" @ ") ? rec.businessName.split(" @ ")[1] : (rec.category || "Company"),
          location: rec.address || rec.city || "Remote",
          country: rec.state || "Global",
          isRemote: true,
          remoteType: (rec.remoteType as RemoteType) || "worldwide",
          category: rec.category,
          tags: rec.tags ? rec.tags.split(",") : [],
          url: rec.phone,
          postedDate: rec.createdAt.toISOString(),
          salary: rec.estimatedValue ? `$${rec.estimatedValue}/yr` : "Competitive",
          source: rec.sourceProvider as any,
          sourceId: rec.providerPlaceId,
          sourceUrl: rec.sourceUrl,
          sourceType: rec.sourceType,
          status: rec.status as PipelineStatus,
          estimatedValue: rec.estimatedValue,
          notes: rec.notes,
          verificationStatus: rec.verificationStatus as VerificationStatus,
          email: rec.email,
          whatsapp: rec.whatsapp,
          contactPageUrl: rec.contactPageUrl,
          bookingUrl: rec.bookingUrl,
          hasContactForm: rec.hasContactForm || false,
          socialProfiles,
          enrichment: parsedEnrichment,
          createdAt: rec.createdAt,
          updatedAt: rec.updatedAt,
        };
        return jobLead;
      } else {
        const isUnlisted = rec.phone.startsWith("unlisted-") || rec.phoneFormatted === "Phone unavailable";
        const physLead: PhysicalLead = {
          id: rec.id,
          type: "physical",
          businessName: rec.businessName,
          phone: rec.phone,
          phoneFormatted: isUnlisted ? "Phone unavailable" : rec.phoneFormatted,
          phoneStatus: isUnlisted ? "unavailable" : "verified",
          address: rec.address,
          city: rec.city,
          state: rec.state,
          country: rec.state || "Kenya",
          postalCode: rec.postalCode,
          latitude: rec.latitude,
          longitude: rec.longitude,
          category: rec.category,
          rating: rec.rating,
          reviewCount: rec.reviewCount,
          hasWebsite: rec.hasWebsite,
          noWebsiteConfidence: (rec.noWebsiteConfidence as WebsiteConfidence) || "High",
          sourceProvider: rec.sourceProvider as any,
          sourceUrl: rec.sourceUrl,
          sourceType: rec.sourceType,
          providerPlaceId: rec.providerPlaceId,
          status: rec.status as PipelineStatus,
          estimatedValue: rec.estimatedValue,
          notes: rec.notes,
          tags: rec.tags ? rec.tags.split(",") : [],
          verificationStatus: rec.verificationStatus as VerificationStatus,
          email: rec.email,
          whatsapp: rec.whatsapp,
          contactPageUrl: rec.contactPageUrl,
          bookingUrl: rec.bookingUrl,
          hasContactForm: rec.hasContactForm || false,
          socialProfiles,
          enrichment: parsedEnrichment,
          createdAt: rec.createdAt,
          updatedAt: rec.updatedAt,
        };
        return physLead;
      }
    });

    return { success: true, data: leads };
  } catch (error: any) {
    console.error("[LeadsAction] Fetch pipeline leads failed:", error);
    return { success: false, data: [], error: error.message || "Failed to fetch leads" };
  }
}

export async function saveLeadToPipelineAction(
  lead: LeadItem,
  userId?: string
): Promise<{
  success: boolean;
  data?: Lead;
  error?: string;
}> {
  try {
    const session = await getCurrentSession();
    const isAdmin = session?.role === "admin" || session?.role === "administrator";
    const targetUserId = (isAdmin || !session) && userId ? userId : session?.userId;

    if (!targetUserId) {
      return { success: false, error: "Authentication required to save leads to pipeline." };
    }

    const isPhysical = lead.type === "physical";
    const pLead = isPhysical ? (lead as PhysicalLead) : null;
    const jLead = !isPhysical ? (lead as OnlineJobLead) : null;

    const businessName = isPhysical
      ? pLead!.businessName
      : `${jLead!.title} @ ${jLead!.company}`;
    const rawPhone = isPhysical ? pLead!.phone : jLead!.url;
    const phone = rawPhone && rawPhone.trim() ? rawPhone.trim() : (isPhysical ? `unlisted-${pLead!.id}` : "");
    const phoneFormatted = isPhysical
      ? (phone.startsWith("unlisted-") ? "Phone unavailable" : (pLead!.phoneFormatted?.trim() || phone))
      : jLead!.url;
    const pipelineType = isPhysical ? "sales" : "job_application";

    if (!businessName || !phone) {
      return { success: false, error: "Identifier and title are required." };
    }

    const saved = await prisma.lead.upsert({
      where: {
        userId_phone_businessName: {
          userId: targetUserId,
          phone,
          businessName,
        },
      },
      create: {
        user: targetUserId ? { connect: { id: targetUserId } } : undefined,
        pipelineType,
        sourceType: isPhysical ? "physical_business" : "job_board",
        sourceProvider: isPhysical ? (pLead!.sourceProvider || "osm") : (jLead!.source || "online"),
        status: lead.status || "NEW",
        estimatedValue: lead.estimatedValue || 1500,
        notes: lead.notes || null,
        contactedAt: lead.contactedAt ? new Date(lead.contactedAt) : null,
        businessName,
        phone,
        phoneFormatted,
        email: lead.email || null,
        whatsapp: lead.whatsapp || null,
        contactPageUrl: lead.contactPageUrl || null,
        bookingUrl: lead.bookingUrl || null,
        address: isPhysical ? pLead!.address || null : null,
        city: isPhysical ? pLead!.city || null : null,
        state: isPhysical ? (pLead!.state || pLead!.country || null) : (jLead!.country || null),
        postalCode: isPhysical ? pLead!.postalCode || null : null,
        category: isPhysical ? pLead!.category || null : jLead!.category || null,
        rating: isPhysical ? pLead!.rating || null : null,
        reviewCount: isPhysical ? pLead!.reviewCount || null : null,
        noWebsiteConfidence: isPhysical ? pLead!.noWebsiteConfidence || "Low" : "Low",
        facebook: lead.socialProfiles?.facebook || null,
        instagram: lead.socialProfiles?.instagram || null,
        linkedin: lead.socialProfiles?.linkedin || null,
        twitter: lead.socialProfiles?.twitter || null,
        enrichmentJson: lead.enrichment ? JSON.stringify(lead.enrichment) : (lead.contacts ? JSON.stringify(lead.contacts) : null),
      },
      update: {
        status: lead.status || undefined,
        estimatedValue: lead.estimatedValue !== undefined ? lead.estimatedValue : undefined,
        notes: lead.notes !== undefined ? lead.notes : undefined,
        contactedAt: lead.contactedAt ? new Date(lead.contactedAt) : undefined,
        phoneFormatted: phoneFormatted || undefined,
        email: lead.email || undefined,
        whatsapp: lead.whatsapp || undefined,
        contactPageUrl: lead.contactPageUrl || undefined,
        bookingUrl: lead.bookingUrl || undefined,
        address: isPhysical ? pLead!.address || undefined : undefined,
        city: isPhysical ? pLead!.city || undefined : undefined,
        state: isPhysical ? (pLead!.state || pLead!.country || undefined) : (jLead!.country || undefined),
        postalCode: isPhysical ? pLead!.postalCode || undefined : undefined,
        category: isPhysical ? pLead!.category || undefined : jLead!.category || undefined,
        rating: isPhysical ? pLead!.rating || undefined : undefined,
        reviewCount: isPhysical ? pLead!.reviewCount || undefined : undefined,
        noWebsiteConfidence: isPhysical ? pLead!.noWebsiteConfidence || undefined : undefined,
        facebook: lead.socialProfiles?.facebook || undefined,
        instagram: lead.socialProfiles?.instagram || undefined,
        linkedin: lead.socialProfiles?.linkedin || undefined,
        twitter: lead.socialProfiles?.twitter || undefined,
        enrichmentJson: lead.enrichment ? JSON.stringify(lead.enrichment) : (lead.contacts ? JSON.stringify(lead.contacts) : undefined),
      },
    });

    safeRevalidatePath("/pipeline");
    safeRevalidatePath("/");
    return { success: true, data: saved };
  } catch (error: any) {
    console.error("[LeadsAction] Save lead failed:", error);
    return { success: false, error: error.message || "Failed to save lead" };
  }
}

export async function bulkSaveLeadsAction(
  leads: LeadItem[],
  userId?: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const session = await getCurrentSession();
    const isAdmin = session?.role === "admin" || session?.role === "administrator";
    const targetUserId = (isAdmin || !session) && userId ? userId : session?.userId;

    if (!targetUserId) {
      return { success: false, count: 0, error: "Authentication required to bulk save leads." };
    }

    let savedCount = 0;
    for (const lead of leads) {
      try {
        const res = await saveLeadToPipelineAction(lead, targetUserId);
        if (res.success) savedCount++;
      } catch (itemErr) {
        console.warn("[LeadsAction] Bulk item save skipped duplicate/invalid:", itemErr);
      }
    }

    safeRevalidatePath("/pipeline");
    safeRevalidatePath("/");
    return { success: true, count: savedCount };
  } catch (error: any) {
    console.error("[LeadsAction] Bulk save failed:", error);
    return { success: false, count: 0, error: error.message || "Bulk save failed." };
  }
}

export async function updateLeadStatusAction(
  leadId: string,
  status: PipelineStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session && process.env.NODE_ENV === "production") {
      return { success: false, error: "Authentication required." };
    }

    // Verify ownership
    const existing = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existing) {
      return { success: false, error: "Lead not found." };
    }

    const isAdmin = session?.role === "admin" || session?.role === "administrator";
    if (session && existing.userId && existing.userId !== session.userId && !isAdmin) {
      return { success: false, error: "Access denied. You do not own this lead." };
    }

    const updateData: { status: string; contactedAt?: Date } = { status };
    if (status === "CONTACTED" || status === "INTERESTED" || status === "CLOSED" || status === "APPLIED" || status === "INTERVIEW") {
      updateData.contactedAt = new Date();
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    safeRevalidatePath("/pipeline");
    safeRevalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("[LeadsAction] Update status failed:", error);
    return { success: false, error: error.message };
  }
}

export async function updateLeadNotesAction(
  leadId: string,
  notes: string,
  estimatedValue?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session && process.env.NODE_ENV === "production") {
      return { success: false, error: "Authentication required." };
    }

    // Verify ownership
    const existing = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existing) {
      return { success: false, error: "Lead not found." };
    }

    const isAdmin = session?.role === "admin" || session?.role === "administrator";
    if (session && existing.userId && existing.userId !== session.userId && !isAdmin) {
      return { success: false, error: "Access denied. You do not own this lead." };
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        notes,
        ...(estimatedValue !== undefined ? { estimatedValue } : {}),
      },
    });

    safeRevalidatePath("/pipeline");
    safeRevalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("[LeadsAction] Update notes failed:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteLeadAction(leadId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session && process.env.NODE_ENV === "production") {
      return { success: false, error: "Authentication required." };
    }

    const existing = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existing) {
      return { success: false, error: "Lead not found." };
    }

    const isAdmin = session?.role === "admin" || session?.role === "administrator";
    if (session && existing.userId && existing.userId !== session.userId && !isAdmin) {
      return { success: false, error: "Access denied. You do not own this lead." };
    }

    await prisma.lead.delete({
      where: { id: leadId },
    });

    safeRevalidatePath("/pipeline");
    safeRevalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("[LeadsAction] Delete lead failed:", error);
    return { success: false, error: error.message };
  }
}

