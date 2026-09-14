/**
 * Production-Grade Server-Side Email Delivery Service with Resend
 * Supports Resend REST API, Webhook integration, and safe dev/staging logger.
 * Never exposes credentials to client-side bundles.
 */

import prisma from '../db';

export interface SendSystemEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  emailType?: 'verification_otp' | 'password_reset' | 'system';
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isSimulated?: boolean;
}

/**
 * Resolves the canonical public base URL for links
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim() !== '') {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, '')}`;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://webhunt-delta.vercel.app';
  }
  return 'http://localhost:3000';
}

/**
 * Resolves the verified sender address for Resend
 */
export function getSenderAddress(): string {
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const fromName = process.env.RESEND_FROM_NAME || 'WebHunt Security';
  
  if (fromEmail.includes('<') && fromEmail.includes('>')) {
    return fromEmail;
  }
  return `${fromName} <${fromEmail.trim()}>`;
}

/**
 * Internal email dispatcher with Resend REST API and DB audit logging
 */
async function dispatchEmail(params: SendSystemEmailParams): Promise<EmailDeliveryResult> {
  const { to, subject, html, text, emailType = 'system' } = params;
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = getSenderAddress();

  // Handle mock test domains safely without failing integration suites in dev
  if (to.includes('example.com') || to.includes('test.com') || to.includes('localhost')) {
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_EMAIL_SIMULATION === 'true') {
      console.log(`[EmailService] Testing address detected (${to}). Logging verification message safely...`);
      const simulatedId = `simulated-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      try {
        await prisma.emailDeliveryLog.create({
          data: {
            email: to,
            emailType,
            messageId: simulatedId,
            status: 'delivered',
          },
        });
      } catch {}
      return {
        success: true,
        messageId: simulatedId,
        isSimulated: true,
      };
    }
  }

  // 1. Production Resend Delivery
  if (resendApiKey && resendApiKey.trim() !== '') {
    try {
      console.log(`[EmailService] Dispatching ${emailType} email to ${to} via Resend API...`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[EmailService] Resend API Error (${res.status}):`, errorText);
        
        try {
          await prisma.emailDeliveryLog.create({
            data: {
              email: to,
              emailType,
              status: 'failed',
              error: `HTTP ${res.status}: ${errorText.slice(0, 255)}`,
            },
          });
        } catch {}

        // In development mode, gracefully output the OTP/system message to the server console
        if (process.env.NODE_ENV !== 'production') {
          console.log('===============================================================');
          console.log(`[EmailService][DEV/SANDBOX FALLBACK] RECIPIENT: ${to}`);
          console.log(`[EmailService] SENDER: ${emailFrom}`);
          console.log(`[EmailService] SUBJECT: ${subject}`);
          console.log('---------------------------------------------------------------');
          console.log(text);
          console.log('===============================================================');

          return {
            success: true,
            messageId: `dev-sandbox-${Date.now()}`,
            isSimulated: true,
          };
        }

        return {
          success: false,
          error: `Email provider rejected message (${res.status}): ${errorText.slice(0, 120)}`,
        };
      }

      const data = await res.json();
      console.log(`[EmailService] Successfully sent email via Resend. Message ID: ${data.id}`);

      try {
        await prisma.emailDeliveryLog.create({
          data: {
            email: to,
            emailType,
            messageId: data.id,
            status: 'sent',
          },
        });
      } catch {}

      return {
        success: true,
        messageId: data.id,
      };
    } catch (err: any) {
      console.error('[EmailService] Resend network error:', err);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('===============================================================');
        console.log(`[EmailService][DEV NETWORK FALLBACK] RECIPIENT: ${to}`);
        console.log(`[EmailService] SUBJECT: ${subject}`);
        console.log('---------------------------------------------------------------');
        console.log(text);
        console.log('===============================================================');

        return {
          success: true,
          messageId: `dev-network-fallback-${Date.now()}`,
          isSimulated: true,
        };
      }

      return {
        success: false,
        error: err.message || 'Failed to reach email provider',
      };
    }
  }

  // 2. Missing Resend API Key Handling
  if (process.env.NODE_ENV === 'production') {
    console.error('[EmailService] CRITICAL: RESEND_API_KEY is not configured in production environment.');
    return {
      success: false,
      error: 'Email delivery service is not configured on this production instance.',
    };
  }

  // Local / Staging Safe Logger Fallback (Dev Only)
  console.log('===============================================================');
  console.log(`[EmailService][DEV/STAGING] SYSTEM EMAIL TO: ${to}`);
  console.log(`[EmailService] SENDER: ${emailFrom}`);
  console.log(`[EmailService] SUBJECT: ${subject}`);
  console.log('---------------------------------------------------------------');
  console.log(text);
  console.log('===============================================================');

  const simulatedId = `simulated-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  try {
    await prisma.emailDeliveryLog.create({
      data: {
        email: to,
        emailType,
        messageId: simulatedId,
        status: 'delivered',
      },
    });
  } catch {}

  return {
    success: true,
    messageId: simulatedId,
    isSimulated: true,
  };
}

/**
 * Sends a 6-digit Verification OTP Email with branded WebHunt styling
 */
export async function sendVerificationOtpEmail(
  to: string,
  name: string,
  otp: string
): Promise<EmailDeliveryResult> {
  const appUrl = getAppBaseUrl();
  const userName = name || 'WebHunt User';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your WebHunt Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8F3F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000000; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #0D0D0D; border: 1px solid #222222; border-radius: 12px; overflow: hidden; padding: 32px 28px;">
          <!-- Header Logo -->
          <tr>
            <td style="padding-bottom: 24px; border-bottom: 1px solid #1C1C1C;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px; color: #EEEEEE;">
                      WebHunt
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #989BA3; background-color: #161616; padding: 4px 8px; border-radius: 4px; border: 1px solid #262626;">
                      Security Verification
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding-top: 28px; padding-bottom: 16px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #EEEEEE; margin: 0 0 12px 0; letter-spacing: -0.3px;">
                Verify Your Account
              </h1>
              <p style="font-size: 14px; line-height: 22px; color: #989BA3; margin: 0 0 24px 0;">
                Hello <strong style="color: #EEEEEE;">${userName}</strong>, welcome to WebHunt. Use the 6-digit verification code below to activate your account and access the lead discovery radar.
              </p>
            </td>
          </tr>

          <!-- OTP Display Box -->
          <tr>
            <td align="center" style="padding: 12px 0 28px 0;">
              <div style="background-color: #111214; border: 1px solid #262626; border-radius: 10px; padding: 20px 24px; display: inline-block;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #EEEEEE;">
                  ${otp}
                </span>
              </div>
              <p style="font-size: 12px; color: #989BA3; margin: 12px 0 0 0;">
                This code expires in <strong>10 minutes</strong>. Single-use only.
              </p>
            </td>
          </tr>

          <!-- Guidance / Security Notice -->
          <tr>
            <td style="border-top: 1px solid #1C1C1C; padding-top: 20px;">
              <p style="font-size: 12px; line-height: 18px; color: #777777; margin: 0 0 16px 0;">
                If you did not create a WebHunt account, you can safely ignore this email. Never share your verification code with anyone.
              </p>
              <p style="font-size: 12px; line-height: 18px; color: #777777; margin: 0;">
                WebHunt &bull; Global Tech & Local Business Outreach Workspace<br>
                <a href="${appUrl}" style="color: #EEEEEE; text-decoration: underline;">${appUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hello ${userName},

Welcome to WebHunt — the Worldwide Local Business & Remote Tech Discovery Workspace.

Your 6-digit verification code is:

${otp}

This code expires in 10 minutes and is single-use only.

If you did not request this verification code, please ignore this email.

Best regards,
WebHunt Security Team
${appUrl}
  `.trim();

  return dispatchEmail({
    to,
    subject: `${otp} is your WebHunt verification code`,
    html,
    text,
    emailType: 'verification_otp',
  });
}

/**
 * Sends a single-use Password Reset Email
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
): Promise<EmailDeliveryResult> {
  const appUrl = getAppBaseUrl();
  const resetLink = `${appUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;
  const userName = name || 'WebHunt User';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Reset your WebHunt password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8F3F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000000; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #0D0D0D; border: 1px solid #222222; border-radius: 12px; overflow: hidden; padding: 32px 28px;">
          <tr>
            <td style="padding-bottom: 24px; border-bottom: 1px solid #1C1C1C;">
              <span style="font-size: 18px; font-weight: 700; color: #EEEEEE;">
                WebHunt
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 28px; padding-bottom: 20px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #EEEEEE; margin: 0 0 12px 0;">
                Password Reset Request
              </h1>
              <p style="font-size: 14px; line-height: 22px; color: #989BA3; margin: 0 0 24px 0;">
                Hello <strong style="color: #EEEEEE;">${userName}</strong>, we received a request to reset your password. Click below to set a new password:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #FFFFFF; color: #000000; text-decoration: none; padding: 12px 26px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                  Reset My Password
                </a>
              </div>
              <p style="font-size: 12px; color: #777777;">
                This link will expire in <strong>1 hour</strong> and is single-use. If you did not make this request, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hello ${userName},

We received a request to reset your WebHunt account password.

To choose a new password, click the link below:
${resetLink}

This link is single-use and will expire in 1 hour. If you did not make this request, you can safely ignore this email.

Best regards,
WebHunt Security Team
${appUrl}
  `.trim();

  return dispatchEmail({
    to,
    subject: 'Reset your WebHunt password',
    html,
    text,
    emailType: 'password_reset',
  });
}

/**
 * Backward-compatible token link verification email
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationToken: string
): Promise<EmailDeliveryResult> {
  const appUrl = getAppBaseUrl();
  const verifyLink = `${appUrl}/auth/verify?token=${encodeURIComponent(verificationToken)}`;
  const userName = name || 'WebHunt User';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="background-color: #000000; font-family: sans-serif; color: #EEEEEE; padding: 30px;">
  <h2>Verify your WebHunt account</h2>
  <p>Hello ${userName}, please click below to verify your account:</p>
  <p><a href="${verifyLink}" style="background-color: #FFFFFF; color: #000000; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Verify Email Address</a></p>
</body>
</html>
  `.trim();

  const text = `
Hello ${userName},

Please verify your WebHunt email address by clicking:
${verifyLink}

Best regards,
WebHunt Security
  `.trim();

  return dispatchEmail({
    to,
    subject: 'Verify your WebHunt account',
    html,
    text,
    emailType: 'system',
  });
}
