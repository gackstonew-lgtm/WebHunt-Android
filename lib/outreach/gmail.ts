import { decryptSecret } from "../security/crypto";

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

/**
 * Interpolates variables like {{business_name}}, {{contact_name}}, {{sender_name}}
 */
export function interpolateEmailTemplate(
  template: string,
  variables: Record<string, string | undefined | null>
): string {
  let result = template;
  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
    result = result.replace(regex, val || "");
  }
  return result;
}

/**
 * Generates an instant zero-config desktop mailto: URI
 */
export function generateMailtoLink(
  toOrPayload: string | SendEmailPayload,
  subject?: string,
  body?: string
): string {
  let toStr = "";
  let subStr = "";
  let bodyStr = "";

  if (typeof toOrPayload === "object" && toOrPayload !== null) {
    toStr = toOrPayload.to || "";
    subStr = toOrPayload.subject || "";
    bodyStr = toOrPayload.body || "";
  } else {
    toStr = toOrPayload || "";
    subStr = subject || "";
    bodyStr = body || "";
  }

  const cleanTo = toStr.trim();
  const cleanSubject = encodeURIComponent(subStr.trim());
  const cleanBody = encodeURIComponent(bodyStr.trim());
  return `mailto:${cleanTo}?subject=${cleanSubject}&body=${cleanBody}`;
}

/**
 * Encodes an RFC 2822 email message in URL-safe base64 format for Gmail API
 */
function createRawMimeMessage(to: string, subject: string, body: string, from?: string): string {
  const lines = [
    from ? `From: ${from}` : "",
    `To: ${to}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  ]
    .filter(Boolean)
    .join("\r\n");

  return Buffer.from(lines)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Creates a Gmail draft in the user's connected Gmail account via Google REST API
 */
export async function createGmailDraft(
  accessToken: string,
  payload: SendEmailPayload
): Promise<{ success: boolean; draftId?: string; error?: string }> {
  try {
    const raw = createRawMimeMessage(payload.to, payload.subject, payload.body);
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          raw,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Gmail API error (${res.status}): ${errText}` };
    }

    const data = await res.json();
    return { success: true, draftId: data.id };
  } catch (err: any) {
    console.error("[GmailOutreach] Draft creation failed:", err);
    return { success: false, error: err.message || "Failed to create Gmail draft" };
  }
}

/**
 * Sends an email directly from the connected Gmail account
 */
export async function sendGmailMessage(
  accessToken: string,
  payload: SendEmailPayload
): Promise<{ success: boolean; messageId?: string; threadId?: string; error?: string }> {
  try {
    const raw = createRawMimeMessage(payload.to, payload.subject, payload.body);
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Gmail API error (${res.status}): ${errText}` };
    }

    const data = await res.json();
    return { success: true, messageId: data.id, threadId: data.threadId };
  } catch (err: any) {
    console.error("[GmailOutreach] Send message failed:", err);
    return { success: false, error: err.message || "Failed to send email via Gmail" };
  }
}
