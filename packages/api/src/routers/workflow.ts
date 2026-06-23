import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertFeatureRequestAccess } from "../lib/access";

export const workflowRouter = createTRPCRouter({
  /** Recent async workflow runs for a feature (PRD generation, AI reviews). */
  listForFeature: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.featureRequestId
      );
      return ctx.prisma.workflowRun.findMany({
        where: { featureRequestId: input.featureRequestId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    }),
});
