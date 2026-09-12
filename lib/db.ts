import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Fallback to standard Vercel Postgres aliases if DATABASE_URL is not directly set
if (!process.env.DATABASE_URL) {
  const pgUrl = 
    process.env.POSTGRES_PRISMA_URL || 
    process.env.POSTGRES_URL || 
    process.env.PRISMA_DATABASE_URL;
  if (pgUrl) {
    process.env.DATABASE_URL = pgUrl;
  }
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

/**
 * Safe database connection verification helper
 */
export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (err: any) {
    return { connected: false, error: err?.message || "Unknown database connection error" };
  }
}

export default prisma;
