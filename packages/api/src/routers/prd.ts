import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { inngest, EVENTS } from "@repo/inngest";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertFeatureRequestAccess } from "../lib/access";
import { consumeAiCreditIfPlatform } from "../lib/credits";
import { enforceRateLimit } from "../lib/ratelimit";

export { PRDSchema, type PRDContent } from "../lib/prd";

export const prdRouter = createTRPCRouter({
  /**
   * Queue PRD generation as an async Inngest workflow. Returns immediately; the
   * UI polls `getByFeatureRequest` / the feature status until the PRD is ready.
   */
  generate: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const fr = await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.featureRequestId,
      );

      // Abuse + cost guardrails: throttle, then consume a credit up front so the
      // user gets immediate feedback (skipped for BYOK workspaces).
      await enforceRateLimit(
        ctx.prisma,
        `ai:prd:${ctx.session.user.id}`,
        10,
        60,
      );
      await consumeAiCreditIfPlatform(ctx.prisma, fr.project.workspaceId);

      // Mark in-flight so the UI can show progress.
      await ctx.prisma.featureRequest.update({
        where: { id: input.featureRequestId },
        data: { status: "GENERATING_PRD" },
      });

      await inngest.send({
        name: EVENTS.PRD_GENERATE,
        data: {
          featureRequestId: input.featureRequestId,
          userId: ctx.session.user.id,
        },
      });

      return { queued: true };
    }),

  /** Cancel a running PRD generation job and revert to DISCOVERY. */
  cancel: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.featureRequestId,
      );

      await ctx.prisma.featureRequest.update({
        where: { id: input.featureRequestId },
        data: { status: "DISCOVERY" },
      });

      await inngest.send({
        name: EVENTS.PRD_CANCEL,
        data: { featureRequestId: input.featureRequestId },
      });

      return { canceled: true };
    }),

  /** Manually edit the generated PRD (PRD Editor). */
  update: protectedProcedure
    .input(
      z.object({
        prdId: z.string(),
        content: z.object({
          assumptions: z.array(z.string().max(1000)).max(50),
          problemStatement: z.string().max(5000),
          goals: z.array(z.string().max(1000)).max(50),
          nonGoals: z.array(z.string().max(1000)).max(50),
          userStories: z.array(z.string().max(1000)).max(100),
          acceptanceCriteria: z.array(z.string().max(1000)).max(100),
          edgeCases: z.array(z.string().max(1000)).max(100),
          technicalRequirements: z.array(z.string().max(1000)).max(100),
          securityRequirements: z.array(z.string().max(1000)).max(100),
          testingStrategy: z.array(z.string().max(1000)).max(100),
          rollbackPlan: z.string().max(5000),
          successMetrics: z.array(z.string().max(1000)).max(50),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const prd = await ctx.prisma.pRD.findUnique({
        where: { id: input.prdId },
        select: { id: true, featureRequestId: true, contentJson: true },
      });
      if (!prd) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });
      }
      await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        prd.featureRequestId,
      );

      // Preserve the AI-generated task list; only overwrite editable sections.
      const existing = (prd.contentJson ?? {}) as Record<string, unknown>;
      return ctx.prisma.pRD.update({
        where: { id: prd.id },
        data: {
          contentJson: { ...existing, ...input.content } as object,
        },
      });
    }),

  getByFeatureRequest: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.featureRequestId,
      );
      return ctx.prisma.pRD.findFirst({
        where: { featureRequestId: input.featureRequestId },
        orderBy: { createdAt: "desc" },
        include: { tasks: { orderBy: { ref: "asc" } } },
      });
    }),
});
