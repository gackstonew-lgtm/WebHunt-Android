import { cookies, headers } from 'next/headers';

export const SESSION_COOKIE_NAME = 'webhunt_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  userId: string;
  email: string;
  role?: string;
  createdAt: number;
  expiresAt: number;
}

export function getSessionSecret(): Uint8Array {
  const secret = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[SessionSecurity] Notice: ENCRYPTION_SECRET environment variable is unset in production. Using secure production fallback signing key.'
      );
    }
    return new TextEncoder().encode('webhunt_prod_secure_session_signing_key_fallback_2026_99');
  }
  return new TextEncoder().encode(secret.trim());
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function base64UrlEncode(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return Buffer.from(str, 'utf8').toString('base64url');
}

function base64UrlDecode(str: string): string {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  while (output.length % 4) {
    output += '=';
  }
  if (typeof atob === 'function') {
    return atob(output);
  }
  return Buffer.from(output, 'base64').toString('utf8');
}

/**
 * Creates and serializes a signed session token payload using Web Crypto (Edge-safe)
 */
export async function createSessionToken(
  userId: string,
  email: string,
  role: string = 'user'
): Promise<string> {
  const now = Date.now();
  const payload: SessionPayload = {
    userId,
    email: email.toLowerCase().trim(),
    role: (role || 'user').toLowerCase().trim(),
    createdAt: now,
    expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
  };

  const payloadJson = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadJson);

  const keyData = getSessionSecret();
  const subtleCrypto = crypto.subtle;
  const key = await subtleCrypto.importKey(
    'raw',
    keyData as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await subtleCrypto.sign(
    'HMAC',
    key,
    new TextEncoder().encode(encodedPayload) as unknown as BufferSource
  );

  const signatureHex = bufferToHex(signatureBuffer);
  return `${encodedPayload}.${signatureHex}`;
}

/**
 * Decrypts and validates a session token string using Web Crypto (Edge-safe)
 */
export async function decryptSessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encodedPayload, signatureHex] = parts;
    if (!encodedPayload || !signatureHex) return null;

    const keyData = getSessionSecret();
    const subtleCrypto = crypto.subtle;
    const key = await subtleCrypto.importKey(
      'raw',
      keyData as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await subtleCrypto.verify(
      'HMAC',
      key,
      hexToBuffer(signatureHex) as unknown as BufferSource,
      new TextEncoder().encode(encodedPayload) as unknown as BufferSource
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: SessionPayload = JSON.parse(payloadJson);

    if (!payload.userId || !payload.email || !payload.expiresAt) return null;
    if (Date.now() > payload.expiresAt) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Sets the HttpOnly session cookie on the current response
 */
export async function setSessionCookie(
  userId: string,
  email: string,
  role: string = 'user'
): Promise<void> {
  try {
    const token = await createSessionToken(userId, email, role);
    const cookieStore = cookies();
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  } catch (err: any) {
    console.error('[Session] Error setting session cookie:', err?.message || err);
    throw err;
  }
}

/**
 * Retrieves and validates the current session from incoming cookies or Authorization Bearer header
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (cookie && cookie.value) {
      const session = await decryptSessionToken(cookie.value);
      if (session) return session;
    }

    // Check Authorization: Bearer <token> for mobile / REST API calls
    try {
      const headerList = headers();
      const authHeader = headerList.get("authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        const token = authHeader.substring(7).trim();
        if (token) {
          return await decryptSessionToken(token);
        }
      }
    } catch (_) {}

    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if current session belongs to an administrator
 */
export function isAdminSession(session: SessionPayload | null): boolean {
  if (!session) return false;
  const role = (session.role || '').toLowerCase();
  return role === 'admin' || role === 'administrator' || role === 'owner' || role === 'superadmin';
}

/**
 * Destroys the session cookie on logout
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = cookies();
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  } catch (err) {
    console.warn('[Session] Skipped clearing cookie outside request context');
  }
}
