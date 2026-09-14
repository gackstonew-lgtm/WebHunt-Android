import prisma from "../db";

interface MemoryCacheEntry<T> {
  data: T;
  expiresAt: number;
}

class DurableCache {
  private memoryCache = new Map<string, MemoryCacheEntry<any>>();
  private maxMemoryEntries = 500;

  /**
   * Generates a deterministic cache key from a provider key and query params.
   */
  generateKey(providerKey: string, params: Record<string, any>): string {
    const parts = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${k}:${v}`)
      .sort()
      .join("|");
    return `${providerKey}:${parts}`;
  }

  /**
   * Retrieves an entry from Tier 1 (in-memory) or Tier 2 (Prisma ApiCache).
   */
  async get<T>(cacheKey: string): Promise<T | null> {
    const now = Date.now();

    // 1. Tier 1: Check In-Memory Cache
    const mem = this.memoryCache.get(cacheKey);
    if (mem) {
      if (mem.expiresAt > now) {
        return mem.data as T;
      }
      this.memoryCache.delete(cacheKey);
    }

    // 2. Tier 2: Check Database ApiCache
    try {
      const record = await prisma.apiCache.findUnique({
        where: { cacheKey },
      });

      if (record) {
        if (record.expiresAt.getTime() > now) {
          try {
            const parsed = JSON.parse(record.payload) as T;
            // Warm Tier 1 cache
            this.setMemory(cacheKey, parsed, Math.floor((record.expiresAt.getTime() - now) / 1000));
            return parsed;
          } catch (parseErr) {
            console.warn(`[DurableCache] Failed to parse cached payload for ${cacheKey}:`, parseErr);
          }
        } else {
          // Asynchronously purge expired record
          prisma.apiCache.delete({ where: { cacheKey } }).catch(() => {});
        }
      }
    } catch (dbErr) {
      // Gracefully handle DB unavailability (e.g. during build or network blips)
      console.warn(`[DurableCache] DB read failed for ${cacheKey}, continuing:`, (dbErr as Error).message);
    }

    return null;
  }

  /**
   * Retrieves an entry supporting bounded stale-cache fallback.
   * If live provider calls fail, allows serving cached data up to maxStaleSeconds (default: 24 hours).
   */
  async getWithStale<T>(
    cacheKey: string,
    maxStaleSeconds = 86400
  ): Promise<{ data: T; isStale: boolean } | null> {
    const now = Date.now();

    // 1. Tier 1: Check In-Memory Cache
    const mem = this.memoryCache.get(cacheKey);
    if (mem) {
      if (mem.expiresAt > now) {
        return { data: mem.data as T, isStale: false };
      }
      if (mem.expiresAt + maxStaleSeconds * 1000 > now) {
        return { data: mem.data as T, isStale: true };
      }
    }

    // 2. Tier 2: Check Database ApiCache
    try {
      const record = await prisma.apiCache.findUnique({
        where: { cacheKey },
      });

      if (record) {
        try {
          const parsed = JSON.parse(record.payload) as T;
          const isFresh = record.expiresAt.getTime() > now;
          const isWithinStaleWindow = record.expiresAt.getTime() + maxStaleSeconds * 1000 > now;

          if (isFresh) {
            this.setMemory(cacheKey, parsed, Math.floor((record.expiresAt.getTime() - now) / 1000));
            return { data: parsed, isStale: false };
          }

          if (isWithinStaleWindow) {
            return { data: parsed, isStale: true };
          }
        } catch (parseErr) {
          console.warn(`[DurableCache] Failed to parse stale payload for ${cacheKey}:`, parseErr);
        }
      }
    } catch (dbErr) {
      console.warn(`[DurableCache] DB read stale failed for ${cacheKey}:`, (dbErr as Error).message);
    }

    return null;
  }

  /**
   * Stores an entry in both Tier 1 (in-memory) and Tier 2 (Prisma ApiCache).
   * Default TTL: 3600 seconds (1 hour).
   */
  async set<T>(
    cacheKey: string,
    provider: string,
    query: string,
    location: string,
    data: T,
    ttlSeconds = 3600
  ): Promise<void> {
    // 1. Store in Tier 1 In-Memory
    this.setMemory(cacheKey, data, ttlSeconds);

    // 2. Store in Tier 2 Database
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      const payload = JSON.stringify(data);

      await prisma.apiCache.upsert({
        where: { cacheKey },
        create: {
          cacheKey,
          provider,
          query: (query || "").substring(0, 255),
          location: (location || "").substring(0, 255),
          payload,
          expiresAt,
        },
        update: {
          payload,
          expiresAt,
          provider,
        },
      });
    } catch (dbErr) {
      console.warn(`[DurableCache] DB write failed for ${cacheKey}:`, (dbErr as Error).message);
    }
  }

  /**
   * Invalidate a key across both tiers.
   */
  async invalidate(cacheKey: string): Promise<void> {
    this.memoryCache.delete(cacheKey);
    try {
      await prisma.apiCache.deleteMany({
        where: { cacheKey },
      });
    } catch (err) {
      console.warn(`[DurableCache] Invalidate failed for ${cacheKey}:`, err);
    }
  }

  /**
   * Purges all expired database entries.
   */
  async cleanupExpired(): Promise<number> {
    try {
      const res = await prisma.apiCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      return res.count;
    } catch (err) {
      console.warn("[DurableCache] Cleanup expired failed:", err);
      return 0;
    }
  }

  private setMemory<T>(cacheKey: string, data: T, ttlSeconds: number) {
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      // Evict first key
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}

export const durableCache = new DurableCache();
export default durableCache;
