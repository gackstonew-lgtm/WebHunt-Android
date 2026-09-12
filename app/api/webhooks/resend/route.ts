import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || '';

/**
 * Verifies Svix webhook signature for Resend events
 */
function verifySvixSignature(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature || !secret) {
    return false;
  }

  // 1. Verify timestamp is within 5 minutes tolerance (300 seconds)
  const timestampNum = parseInt(timestamp, 10);
  if (isNaN(timestampNum)) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampNum) > 300) {
    console.warn('[ResendWebhook] Request timestamp out of tolerance window');
    return false;
  }

  try {
    // 2. Format secret: remove 'whsec_' prefix and decode base64
    const cleanSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
    const secretBytes = Buffer.from(cleanSecret, 'base64');

    // 3. Construct signing payload: "${id}.${timestamp}.${rawBody}"
    const toSign = `${id}.${timestamp}.${rawBody}`;
    const expectedSig = crypto
      .createHmac('sha256', secretBytes)
      .update(toSign)
      .digest('base64');

    // 4. Split signatures in header (space separated, format: "v1,base64signature")
    const passedSignatures = signature.split(' ');
    for (const item of passedSignatures) {
      const [version, sig] = item.split(',');
      if (version === 'v1' && sig) {
        const sigBuffer = Buffer.from(sig, 'base64');
        const expectedBuffer = Buffer.from(expectedSig, 'base64');
        if (sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
          return true;
        }
      }
    }
    return false;
  } catch (err) {
    console.error('[ResendWebhook] Signature verification exception:', err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    // 1. Verify Webhook Signature
    const isValid = verifySvixSignature(
      rawBody,
      { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
      WEBHOOK_SECRET
    );

    if (!isValid) {
      console.warn('[ResendWebhook] Invalid signature or unauthorized request');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // 2. Parse Event JSON
    let eventData: any;
    try {
      eventData = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const eventId = svixId || eventData.id || `event-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const eventType = eventData.type || 'unknown';

    console.log(`[ResendWebhook] Processing event: ${eventType} (ID: ${eventId})`);

    // 3. Idempotency Protection: Check if event was already processed
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      console.log(`[ResendWebhook] Event ${eventId} already processed. Skipping.`);
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    // Record event as processed
    await prisma.webhookEvent.create({
      data: {
        eventId,
        eventType,
        payload: JSON.stringify({ type: eventType, created_at: eventData.created_at }),
      },
    });

    // 4. Update Email Delivery Logs if messageId is referenced
    const emailId = eventData.data?.email_id || eventData.data?.id;
    if (emailId) {
      let deliveryStatus: string | null = null;
      if (eventType === 'email.delivered') deliveryStatus = 'delivered';
      else if (eventType === 'email.bounced') deliveryStatus = 'bounced';
      else if (eventType === 'email.failed') deliveryStatus = 'failed';
      else if (eventType === 'email.sent') deliveryStatus = 'sent';

      if (deliveryStatus) {
        await prisma.emailDeliveryLog.updateMany({
          where: { messageId: emailId },
          data: { status: deliveryStatus },
        });
      }
    }

    return NextResponse.json({ received: true, eventType, eventId }, { status: 200 });
  } catch (error: any) {
    console.error('[ResendWebhook] Processing error:', error);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}
