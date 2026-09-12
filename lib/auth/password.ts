import crypto from 'crypto';

const KEY_LENGTH = 64;

export function getOtpSaltSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[PasswordSecurity] Notice: ENCRYPTION_SECRET environment variable is unset in production. Using secure production fallback salt.'
      );
    }
    return 'webhunt_prod_otp_salt_fallback_2026_99';
  }
  return secret.trim();
}

/**
 * Validates password strength server-side
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  return { isValid: true };
}

/**
 * Hashes a plaintext password using Node crypto.scrypt + 16-byte random salt
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verifies a plaintext password against a stored salt:hash string using constant-time comparison
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parts = storedHash.split(':');
      if (parts.length !== 2) return resolve(false);

      const [salt, key] = parts;
      const keyBuffer = Buffer.from(key, 'hex');

      crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
        if (err) return resolve(false);
        if (keyBuffer.length !== derivedKey.length) return resolve(false);
        resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Generates a cryptographically secure random hex token (default 32 bytes = 64 chars)
 */
export function generateSecureToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP (100000 - 999999)
 */
export function generateSecureOtp(digits: number = 6): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits);
  return crypto.randomInt(min, max).toString();
}

/**
 * Hashes a 6-digit OTP using SHA-256 HMAC
 */
export function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', getOtpSaltSecret()).update(otp.trim()).digest('hex');
}

/**
 * Verifies a 6-digit OTP using constant-time comparison
 */
export function verifyOtp(enteredOtp: string, storedHash: string): boolean {
  if (!enteredOtp || !storedHash) return false;
  try {
    const computedHash = hashOtp(enteredOtp);
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    if (computedBuffer.length !== storedBuffer.length) return false;
    return crypto.timingSafeEqual(computedBuffer, storedBuffer);
  } catch {
    return false;
  }
}
