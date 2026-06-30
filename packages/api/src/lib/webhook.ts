import { prisma } from "@repo/db";

/**
 * Idempotency guard for inbound webhooks. Providers (GitHub, Razorpay) can
 * re-deliver the same event; we record each delivery id and skip duplicates.
 *
 * Returns true if this event was ALREADY processed (caller should no-op).
 */
export async function alreadyProcessed(
  provider: string,
  eventId: string | null | undefined,
): Promise<boolean> {
  if (!eventId) return false; // can't dedupe without an id; process it
  try {
    await prisma.webhookEvent.create({ data: { provider, eventId } });
    return false; // first time we've seen it
  } catch {
    return true; // unique-constraint violation → already handled
  }
}
