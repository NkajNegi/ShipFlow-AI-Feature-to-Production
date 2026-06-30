import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { inngest, EVENTS } from "@repo/inngest";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertFeatureRequestAccess } from "../lib/access";
import { consumeAiCreditIfPlatform } from "../lib/credits";
import { enforceRateLimit } from "../lib/ratelimit";
import { logAudit } from "../lib/audit";

export const codegenRouter = createTRPCRouter({
  /**
   * Queue AI codegen for a feature as an async Inngest workflow. Drafts a code
   * patch across providers, critiques it, and opens a draft PR if approved.
   * Returns the CodegenRun id; the UI polls `get` for progress.
   */
  generate: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (process.env.CODEGEN_ENABLED !== "true") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "AI codegen is not enabled on this deployment.",
        });
      }

      const fr = await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.featureRequestId,
        ["ADMIN", "LEAD"],
      );

      const feature = await ctx.prisma.featureRequest.findUnique({
        where: { id: input.featureRequestId },
        include: {
          prds: { take: 1 },
          project: {
            select: {
              workspace: { select: { githubInstallations: true } },
              repositories: { take: 1, select: { id: true } },
            },
          },
        },
      });
      if (!feature) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Feature not found." });
      }
      if (feature.prds.length === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Generate a PRD before generating code.",
        });
      }
      if (
        !feature.project.workspace.githubInstallations?.[0]?.installationId ||
        feature.project.repositories.length === 0
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Connect a GitHub repository before generating code.",
        });
      }

      // Codegen is the most expensive AI op — throttle hard, then bill a credit.
      await enforceRateLimit(
        ctx.prisma,
        `ai:codegen:${ctx.session.user.id}`,
        5,
        60,
      );
      await consumeAiCreditIfPlatform(ctx.prisma, fr.project.workspaceId);

      const run = await ctx.prisma.codegenRun.create({
        data: {
          featureRequestId: input.featureRequestId,
          requestedById: ctx.session.user.id,
          status: "PENDING",
        },
      });

      await logAudit({
        workspaceId: fr.project.workspaceId,
        actorId: ctx.session.user.id,
        action: "CODEGEN_REQUESTED",
        target: input.featureRequestId,
      });

      await inngest.send({
        name: EVENTS.CODEGEN_RUN,
        data: { codegenRunId: run.id },
      });

      return { codegenRunId: run.id };
    }),

  /** Latest codegen run for a feature, for UI polling. */
  get: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.featureRequestId,
      );
      return ctx.prisma.codegenRun.findFirst({
        where: { featureRequestId: input.featureRequestId },
        orderBy: { createdAt: "desc" },
      });
    }),
});
