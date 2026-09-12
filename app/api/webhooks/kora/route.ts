import { NextRequest, NextResponse } from "next/server";
import { verifyKoraWebhookSignature } from "@/lib/kora";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-korapay-signature");

    const isValid = verifyKoraWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("Invalid Kora webhook signature attempt");
      return NextResponse.json(
        { status: "error", message: "Invalid cryptographic signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event || event.type || "charge.success";
    const eventData = event.data || {};
    const reference = eventData.reference || eventData.transaction_reference;

    console.log("[Kora Webhook] Received " + eventType + " for ref: " + reference);

    try {
      if (reference) {
        await prisma.webhookEvent.upsert({
          where: { eventId: "kora_" + reference + "_" + eventType },
          create: {
            eventId: "kora_" + reference + "_" + eventType,
            eventType: "kora." + eventType,
            payload: rawBody,
          },
          update: {
            payload: rawBody,
            processedAt: new Date(),
          },
        });

        // Activate subscription on charge.success
        if (eventType === "charge.success" || eventType === "charge_completed") {
          const metadata = eventData.metadata || {};
          let targetUserId = metadata.userId;

          if (!targetUserId && eventData.customer?.email) {
            const customerUser = await prisma.user.findUnique({
              where: { email: eventData.customer.email.toLowerCase().trim() },
              select: { id: true },
            });
            targetUserId = customerUser?.id;
          }

          if (targetUserId) {
            const { activateUserSubscription } = await import("@/lib/auth/subscription");
            await activateUserSubscription({
              userId: targetUserId,
              planId: metadata.planId || "monthly",
              providerReference: reference,
              amount: eventData.amount,
              currency: eventData.currency,
              provider: "kora",
            });
            console.log("[Kora Webhook] Auto-activated subscription for user " + targetUserId);
          }
        }
      }
    } catch (dbErr) {
      console.warn("[Kora Webhook] DB handling notice:", dbErr);
    }

    return NextResponse.json({ status: "success", received: true });
  } catch (err: any) {
    console.error("[Kora Webhook Error]:", err);
    return NextResponse.json(
      { status: "error", message: err.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
