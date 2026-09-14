import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || "").toLowerCase().trim();
    const name = (body.name || "").trim();
    const password = body.password || "";

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.isValid) {
      return NextResponse.json(
        { success: false, error: strengthCheck.message || "Password does not meet requirements." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        role: "user",
        status: "active",
        emailVerified: new Date(),
        profile: {
          create: {
            fullName: name || email.split("@")[0],
            professionalTitle: "",
            skillsJson: JSON.stringify([]),
            currency: "USD",
            timezone: "Africa/Nairobi (EAT, UTC+3)",
            email: email,
          },
        },
      },
    });

    const token = await createSessionToken(newUser.id, newUser.email, newUser.role);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("[MobileAuth] Registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
