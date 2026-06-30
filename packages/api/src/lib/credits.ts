import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@repo/db";

type Db = PrismaClient;

/**
 * Consume one platform AI credit, atomically, unless the workspace is using its
 * own (BYOK) Anthropic key — in which case AI usage is billed to the user's own
 * account and no platform credit is spent.
 *
 * The atomic `updateMany` guard (`aiReviewCredits > 0`) prevents a race where
 * concurrent requests could drive credits negative.
 */
export async function consumeAiCreditIfPlatform(
  prisma: Db,
  workspaceId: string,
): Promise<void> {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { anthropicApiKeyEnc: true, openRouterApiKeyEnc: true },
  });

  // BYOK: the user pays their own API provider directly, so don't spend a platform credit.
  if (ws?.anthropicApiKeyEnc || ws?.openRouterApiKeyEnc) return;

  const res = await prisma.workspace.updateMany({
    where: { id: workspaceId, aiReviewCredits: { gt: 0 } },
    data: { aiReviewCredits: { decrement: 1 } },
  });

  if (res.count === 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "No AI credits remaining. Add your own Anthropic key in Settings or upgrade to Pro.",
    });
  }
}
