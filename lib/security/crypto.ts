import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Returns a 32-byte encryption key derived from environment
 */
export function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.trim() === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[CryptoSecurity] CRITICAL: ENCRYPTION_SECRET environment variable is missing in production. Fail fast."
      );
    }
    return crypto.createHash("sha256").update("webhunt_dev_only_encryption_key_2026_untrusted_local_salt").digest();
  }
  return crypto.createHash("sha256").update(secret.trim()).digest();
}

/**
 * Encrypts sensitive string (e.g. OAuth tokens, API secrets) with AES-256-GCM
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return "";
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    // Format: iv:authTag:encrypted
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("[Crypto] Encryption failed:", err);
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypts AES-256-GCM encrypted string
 */
export function decryptSecret(cipherText: string): string {
  if (!cipherText) return "";
  try {
    const parts = cipherText.split(":");
    if (parts.length !== 3) {
      // Return raw string if not encrypted
      return cipherText;
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("[Crypto] Decryption failed:", err);
    return "";
  }
}

/**
 * Sanitizes untrusted text (e.g. scraped website text, job descriptions) to guard against prompt injections
 */
export function sanitizeUntrustedText(input?: string | null): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    // Neutralize prompt injection markers
    .replace(/ignore\s+all\s+previous\s+instructions/gi, "[filtered]")
    .replace(/system\s+prompt\s*:/gi, "prompt:")
    .replace(/you\s+are\s+now\s+a/gi, "context:")
    .replace(/\s+/g, " ")
    .trim();
}
