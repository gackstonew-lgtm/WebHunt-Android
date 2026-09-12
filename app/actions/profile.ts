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

const DEFAULT_PROFILE: UserProfileData = {
  fullName: "Gackstone Baraka",
  professionalTitle: "Full-Stack Software Engineer & Solutions Architect",
  bio: "Experienced full-stack engineer building production-grade web applications, high-converting digital portals, and automated business workflows.",
  yearsExperience: 4,
  skills: [
    "Next.js",
    "React",
    "TypeScript",
    "Node.js",
    "Tailwind CSS",
    "PostgreSQL",
    "Prisma",
    "REST APIs",
    "Python",
    "E-commerce",
    "M-Pesa Integrations",
    "Tailored Portals",
  ],
  portfolioUrl: "https://portfolio.quantumcode.co.ke",
  githubUrl: "https://github.com",
  linkedinUrl: "https://linkedin.com",
  resumeUrl: "",
  hourlyRateUsd: 50,
  hourlyRateKes: 6500,
  projectRateUsd: 1500,
  projectRateKes: 180000,
  currency: "USD",
  timezone: "Africa/Nairobi (EAT, UTC+3)",
  languages: ["English (Fluent)", "Swahili (Native)"],
  phone: "+254700000000",
  whatsapp: "+254700000000",
  email: "contact@example.com",
  city: "Nairobi",
  country: "Kenya",
  mpesaTillNumber: "987654",
  mpesaPaybillNumber: "400200",
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
        success: true,
        data: DEFAULT_PROFILE,
      };
    }

    let profile = await prisma.userProfile.findUnique({
      where: { userId: targetUserId },
    });

    if (!profile) {
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!user) {
        return {
          success: true,
          data: DEFAULT_PROFILE,
        };
      }

      profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          fullName: user.name || DEFAULT_PROFILE.fullName,
          professionalTitle: DEFAULT_PROFILE.professionalTitle,
          bio: DEFAULT_PROFILE.bio,
          yearsExperience: DEFAULT_PROFILE.yearsExperience,
          skillsJson: JSON.stringify(DEFAULT_PROFILE.skills),
          portfolioUrl: DEFAULT_PROFILE.portfolioUrl,
          githubUrl: DEFAULT_PROFILE.githubUrl,
          linkedinUrl: DEFAULT_PROFILE.linkedinUrl,
          resumeUrl: DEFAULT_PROFILE.resumeUrl,
          hourlyRateUsd: DEFAULT_PROFILE.hourlyRateUsd,
          hourlyRateKes: DEFAULT_PROFILE.hourlyRateKes,
          projectRateUsd: DEFAULT_PROFILE.projectRateUsd,
          projectRateKes: DEFAULT_PROFILE.projectRateKes,
          currency: DEFAULT_PROFILE.currency || "USD",
          timezone: DEFAULT_PROFILE.timezone || "Africa/Nairobi",
          languagesJson: JSON.stringify(DEFAULT_PROFILE.languages),
          phone: DEFAULT_PROFILE.phone,
          whatsapp: DEFAULT_PROFILE.whatsapp,
          email: user.email || DEFAULT_PROFILE.email,
          city: DEFAULT_PROFILE.city,
          country: DEFAULT_PROFILE.country,
          mpesaTillNumber: DEFAULT_PROFILE.mpesaTillNumber,
          mpesaPaybillNumber: DEFAULT_PROFILE.mpesaPaybillNumber,
        },
      });
    }

    let skills: string[] = [];
    try {
      skills = JSON.parse(profile.skillsJson);
    } catch (_) {
      skills = DEFAULT_PROFILE.skills;
    }

    let languages: string[] = [];
    try {
      languages = profile.languagesJson ? JSON.parse(profile.languagesJson) : DEFAULT_PROFILE.languages;
    } catch (_) {
      languages = DEFAULT_PROFILE.languages || [];
    }

    return {
      success: true,
      data: {
        id: profile.id,
        userId: profile.userId,
        fullName: profile.fullName,
        professionalTitle: profile.professionalTitle,
        bio: profile.bio || "",
        yearsExperience: profile.yearsExperience || 3,
        skills,
        portfolioUrl: profile.portfolioUrl || "",
        githubUrl: profile.githubUrl || "",
        linkedinUrl: profile.linkedinUrl || "",
        resumeUrl: profile.resumeUrl || "",
        hourlyRateUsd: profile.hourlyRateUsd || 45,
        hourlyRateKes: profile.hourlyRateKes || 5500,
        projectRateUsd: profile.projectRateUsd || 1500,
        projectRateKes: profile.projectRateKes || 180000,
        currency: (profile.currency as any) || "USD",
        timezone: profile.timezone || "Africa/Nairobi",
        languages,
        phone: profile.phone || "",
        whatsapp: profile.whatsapp || "",
        email: profile.email || "",
        city: profile.city || "Nairobi",
        country: profile.country || "Kenya",
        mpesaTillNumber: profile.mpesaTillNumber || "",
        mpesaPaybillNumber: profile.mpesaPaybillNumber || "",
      },
    };
  } catch (error: any) {
    console.error("[ProfileAction] Fetch error:", error);
    return {
      success: false,
      data: DEFAULT_PROFILE,
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
      if (process.env.NODE_ENV === "production") {
        return { success: false, error: "Authentication required to save profile" };
      }
      // Dev mode fallback
      const user = await prisma.user.findFirst();
      if (!user) {
        return { success: false, error: "User record required to attach profile" };
      }
      targetUserId = user.id;
    }

    const saved = await prisma.userProfile.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        fullName: data.fullName,
        professionalTitle: data.professionalTitle,
        bio: data.bio || null,
        yearsExperience: data.yearsExperience || 3,
        skillsJson: JSON.stringify(data.skills || []),
        portfolioUrl: data.portfolioUrl || null,
        githubUrl: data.githubUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        resumeUrl: data.resumeUrl || null,
        hourlyRateUsd: data.hourlyRateUsd || 45,
        hourlyRateKes: data.hourlyRateKes || 5500,
        projectRateUsd: data.projectRateUsd || 1500,
        projectRateKes: data.projectRateKes || 180000,
        currency: data.currency || "USD",
        timezone: data.timezone || "Africa/Nairobi",
        languagesJson: JSON.stringify(data.languages || []),
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        city: data.city || "Nairobi",
        country: data.country || "Kenya",
        mpesaTillNumber: data.mpesaTillNumber || null,
        mpesaPaybillNumber: data.mpesaPaybillNumber || null,
      },
      update: {
        fullName: data.fullName,
        professionalTitle: data.professionalTitle,
        bio: data.bio || null,
        yearsExperience: data.yearsExperience || 3,
        skillsJson: JSON.stringify(data.skills || []),
        portfolioUrl: data.portfolioUrl || null,
        githubUrl: data.githubUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        resumeUrl: data.resumeUrl || null,
        hourlyRateUsd: data.hourlyRateUsd || 45,
        hourlyRateKes: data.hourlyRateKes || 5500,
        projectRateUsd: data.projectRateUsd || 1500,
        projectRateKes: data.projectRateKes || 180000,
        currency: data.currency || "USD",
        timezone: data.timezone || "Africa/Nairobi",
        languagesJson: JSON.stringify(data.languages || []),
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        city: data.city || "Nairobi",
        country: data.country || "Kenya",
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
