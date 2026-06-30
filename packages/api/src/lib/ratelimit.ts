import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@repo/db";

type Db = PrismaClient;

/**
 * Simple DB-backed fixed-window rate limiter. Durable across serverless
 * instances (unlike in-memory counters). Buckets are keyed by
 * `<key>:<windowIndex>` and expire automatically.
 *
 * @param key        logical key, e.g. `ai:<userId>`
 * @param limit      max requests allowed per window
 * @param windowSec  window length in seconds
 */
export async function enforceRateLimit(
  prisma: Db,
  key: string,
  limit: number,
  windowSec: number,
): Promise<void> {
  const windowMs = windowSec * 1000;
  const windowIndex = Math.floor(Date.now() / windowMs);
  const bucketKey = `${key}:${windowIndex}`;
  const expiresAt = new Date((windowIndex + 1) * windowMs);

  const rec = await prisma.rateLimit.upsert({
    where: { bucketKey },
    update: { count: { increment: 1 } },
    create: { bucketKey, count: 1, expiresAt },
  });

  if (rec.count > limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        "You're doing that too fast. Please wait a moment and try again.",
    });
  }
}
