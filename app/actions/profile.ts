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

export interface UserProfileData {
  id?: string;
  userId?: string;
  fullName: string;
  professionalTitle: string;
  bio?: string;
  yearsExperience?: number;
  skills: string[];
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  hourlyRateUsd?: number;
  hourlyRateKes?: number;
  projectRateUsd?: number;
  projectRateKes?: number;
  currency?: "USD" | "KES";
  timezone?: string;
  languages?: string[];
  phone?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  country?: string;
  mpesaTillNumber?: string;
  mpesaPaybillNumber?: string;
}

const EMPTY_PROFILE: UserProfileData = {
  fullName: "",
  professionalTitle: "",
  bio: "",
  yearsExperience: 0,
  skills: [],
  portfolioUrl: "",
  githubUrl: "",
  linkedinUrl: "",
  resumeUrl: "",
  hourlyRateUsd: 0,
  hourlyRateKes: 0,
  projectRateUsd: 0,
  projectRateKes: 0,
  currency: "USD",
  timezone: "Africa/Nairobi",
  languages: ["English"],
  phone: "",
  whatsapp: "",
  email: "",
  city: "",
  country: "",
  mpesaTillNumber: "",
  mpesaPaybillNumber: "",
};

export async function getUserProfileAction(userId?: string): Promise<{
  success: boolean;
  data: UserProfileData;
  error?: string;
}> {
  try {
    const session = await getCurrentSession();
    let targetUserId = session?.userId;
    if (userId && (session?.role === "admin" || session?.userId === userId)) {
      targetUserId = userId;
    }

    if (!targetUserId) {
      return {
        success: false,
        data: EMPTY_PROFILE,
        error: "Authentication required",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      return {
        success: false,
        data: EMPTY_PROFILE,
        error: "User not found",
      };
    }

    let profile = await prisma.userProfile.findUnique({
      where: { userId: targetUserId },
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          fullName: user.name || user.email.split("@")[0] || "",
          professionalTitle: "",
          bio: "",
          yearsExperience: 0,
          skillsJson: JSON.stringify([]),
          portfolioUrl: "",
          githubUrl: "",
          linkedinUrl: "",
          resumeUrl: "",
          hourlyRateUsd: 0,
          hourlyRateKes: 0,
          projectRateUsd: 0,
          projectRateKes: 0,
          currency: "USD",
          timezone: "Africa/Nairobi",
          languagesJson: JSON.stringify(["English"]),
          phone: "",
          whatsapp: "",
          email: user.email,
          city: "",
          country: "",
          mpesaTillNumber: "",
          mpesaPaybillNumber: "",
        },
      });
    }

    let skills: string[] = [];
    try {
      skills = JSON.parse(profile.skillsJson);
    } catch (_) {
      skills = [];
    }

    let languages: string[] = [];
    try {
      languages = profile.languagesJson ? JSON.parse(profile.languagesJson) : ["English"];
    } catch (_) {
      languages = ["English"];
    }

    return {
      success: true,
      data: {
        id: profile.id,
        userId: profile.userId,
        fullName: profile.fullName,
        professionalTitle: profile.professionalTitle,
        bio: profile.bio || "",
        yearsExperience: profile.yearsExperience || 0,
        skills,
        portfolioUrl: profile.portfolioUrl || "",
        githubUrl: profile.githubUrl || "",
        linkedinUrl: profile.linkedinUrl || "",
        resumeUrl: profile.resumeUrl || "",
        hourlyRateUsd: profile.hourlyRateUsd || 0,
        hourlyRateKes: profile.hourlyRateKes || 0,
        projectRateUsd: profile.projectRateUsd || 0,
        projectRateKes: profile.projectRateKes || 0,
        currency: (profile.currency as any) || "USD",
        timezone: profile.timezone || "Africa/Nairobi",
        languages,
        phone: profile.phone || "",
        whatsapp: profile.whatsapp || "",
        email: profile.email || user.email || "",
        city: profile.city || "",
        country: profile.country || "",
        mpesaTillNumber: profile.mpesaTillNumber || "",
        mpesaPaybillNumber: profile.mpesaPaybillNumber || "",
      },
    };
  } catch (error: any) {
    console.error("[ProfileAction] Fetch error:", error);
    return {
      success: false,
      data: EMPTY_PROFILE,
      error: error.message,
    };
  }
}

export async function saveUserProfileAction(
  data: UserProfileData,
  userId?: string
): Promise<{
  success: boolean;
  data?: UserProfileData;
  error?: string;
}> {
  try {
    const session = await getCurrentSession();
    let targetUserId = session?.userId;
    if (userId && (session?.role === "admin" || session?.userId === userId)) {
      targetUserId = userId;
    }

    if (!targetUserId) {
      return { success: false, error: "Authentication required to save profile" };
    }

    const saved = await prisma.userProfile.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        fullName: data.fullName,
        professionalTitle: data.professionalTitle,
        bio: data.bio || null,
        yearsExperience: data.yearsExperience ?? 0,
        skillsJson: JSON.stringify(data.skills || []),
        portfolioUrl: data.portfolioUrl || null,
        githubUrl: data.githubUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        resumeUrl: data.resumeUrl || null,
        hourlyRateUsd: data.hourlyRateUsd ?? null,
        hourlyRateKes: data.hourlyRateKes ?? null,
        projectRateUsd: data.projectRateUsd ?? null,
        projectRateKes: data.projectRateKes ?? null,
        currency: data.currency || "USD",
        timezone: data.timezone || "Africa/Nairobi",
        languagesJson: JSON.stringify(data.languages || []),
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        city: data.city || null,
        country: data.country || null,
        mpesaTillNumber: data.mpesaTillNumber || null,
        mpesaPaybillNumber: data.mpesaPaybillNumber || null,
      },
      update: {
        fullName: data.fullName,
        professionalTitle: data.professionalTitle,
        bio: data.bio || null,
        yearsExperience: data.yearsExperience ?? 0,
        skillsJson: JSON.stringify(data.skills || []),
        portfolioUrl: data.portfolioUrl || null,
        githubUrl: data.githubUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        resumeUrl: data.resumeUrl || null,
        hourlyRateUsd: data.hourlyRateUsd ?? null,
        hourlyRateKes: data.hourlyRateKes ?? null,
        projectRateUsd: data.projectRateUsd ?? null,
        projectRateKes: data.projectRateKes ?? null,
        currency: data.currency || "USD",
        timezone: data.timezone || "Africa/Nairobi",
        languagesJson: JSON.stringify(data.languages || []),
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        city: data.city || null,
        country: data.country || null,
        mpesaTillNumber: data.mpesaTillNumber || null,
        mpesaPaybillNumber: data.mpesaPaybillNumber || null,
      },
    });

    safeRevalidatePath("/");
    safeRevalidatePath("/pipeline");

    return {
      success: true,
      data: {
        ...data,
        id: saved.id,
        userId: saved.userId,
      },
    };
  } catch (error: any) {
    console.error("[ProfileAction] Save error:", error);
    return {
      success: false,
      error: error.message || "Failed to save profile",
    };
  }
}
