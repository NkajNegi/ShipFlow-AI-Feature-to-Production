import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@repo/db";

/**
 * Per-plan usage limits (Free vs Pro). Single source of truth, shared by the
 * billing status query and the enforcement guards.
 */
export const PLAN_LIMITS = {
  FREE: { projects: 3, repositories: 1, label: "Free" },
  PRO: { projects: Infinity, repositories: Infinity, label: "Pro" },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

/** Resolve the limits for a (possibly unknown) plan tier, defaulting to Free. */
export function planLimits(tier?: string | null) {
  return PLAN_LIMITS[tier === "PRO" ? "PRO" : "FREE"];
}

/**
 * Enforce the per-plan repository limit for a workspace. Call this BEFORE
 * creating a *new* repository (re-linking an already-connected repo doesn't add
 * one, so skip the check there). Throws FORBIDDEN when the limit is reached.
 */
export async function assertRepoLimit(
  prisma: PrismaClient,
  workspaceId: string,
): Promise<void> {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { planTier: true },
  });
  const limit = planLimits(ws?.planTier).repositories;
  if (limit === Infinity) return;

  const count = await prisma.repository.count({
    where: { project: { workspaceId } },
  });
  if (count >= limit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        `Your plan allows ${limit} repositor${limit === 1 ? "y" : "ies"}. ` +
        "Upgrade to Pro to connect more.",
    });
  }
}
