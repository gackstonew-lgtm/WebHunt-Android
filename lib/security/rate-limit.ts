/**
 * WebHunt In-Memory Sliding-Window Rate Limiter
 * Provides abuse protection for authentication, search radar, external API queries, and exports.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    // Keep entries that have timestamps within the last 1 hour
    const valid = entry.timestamps.filter((t) => now - t < 3600 * 1000);
    if (valid.length === 0) {
      store.delete(key);
    } else {
      entry.timestamps = valid;
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Checks and increments rate limit counter for a given key within a sliding window.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  cleanupStaleEntries();

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  const entry = store.get(key) || { timestamps: [] };
  // Filter out timestamps outside current sliding window
  const activeTimestamps = entry.timestamps.filter((t) => t > cutoff);

  if (activeTimestamps.length >= limit) {
    const oldest = activeTimestamps[0];
    const retryAfterMs = oldest + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  activeTimestamps.push(now);
  store.set(key, { timestamps: activeTimestamps });

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - activeTimestamps.length),
    retryAfterSeconds: 0,
  };
}

/**
 * Helper to reset rate limit for a key (e.g. after successful login)
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}
