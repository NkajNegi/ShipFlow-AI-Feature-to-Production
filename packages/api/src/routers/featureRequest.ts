import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  assertProjectAccess,
  assertWorkspaceMember,
  assertFeatureRequestAccess,
} from "../lib/access";
import { logAudit } from "../lib/audit";

export const featureRequestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string().min(1).max(200),
        context: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.projectId
      );
      return ctx.prisma.featureRequest.create({
        data: {
          title: input.title,
          context: input.context,
          projectId: input.projectId,
        },
      });
    }),

  /**
   * Phase 2 — human approval of the plan. A LEAD/ADMIN reviews the PRD + tasks
   * and explicitly approves the plan before development starts, moving the
   * feature from PLANNING to PLANNED (ready for development).
   */
  approvePlan: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const fr = await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.featureRequestId,
        ["ADMIN", "LEAD"]
      );

      const feature = await ctx.prisma.featureRequest.findUnique({
        where: { id: input.featureRequestId },
        select: {
          title: true,
          status: true,
          _count: { select: { prds: true } },
        },
      });
      if (!feature) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Feature not found." });
      }
      if (feature._count.prds === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Generate a PRD and tasks before approving the plan.",
        });
      }
      if (feature.status !== "PLANNING") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `The plan can only be approved from the PLANNING stage (current: ${feature.status}).`,
        });
      }

      const updated = await ctx.prisma.featureRequest.update({
        where: { id: input.featureRequestId },
        data: { status: "PLANNED" },
      });

      await logAudit({
        workspaceId: fr.project.workspaceId,
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        action: "PLAN_APPROVED",
        target: updated.title,
      });

      return updated;
    }),

  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProjectAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.projectId
      );
      return ctx.prisma.featureRequest.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
      });
    }),

  /** All feature requests across a workspace (for the dashboard overview). */
  listByWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId
      );
      return ctx.prisma.featureRequest.findMany({
        where: { project: { workspaceId: input.workspaceId } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          source: true,
          createdAt: true,
          project: { select: { id: true, name: true } },
          _count: { select: { pullRequests: true } },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const fr = await ctx.prisma.featureRequest.findUnique({
        where: { id: input.id },
        include: { project: true },
      });
      if (!fr) throw new TRPCError({ code: "NOT_FOUND" });

      const member = await ctx.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: { userId: ctx.session.user.id, workspaceId: fr.project.workspaceId },
        },
      });

      if (!member) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this workspace." });
      }

      await ctx.prisma.featureRequest.delete({ where: { id: input.id } });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(200).optional(),
      context: z.string().min(1).max(10000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const fr = await ctx.prisma.featureRequest.findUnique({
        where: { id: input.id },
        include: { project: true },
      });
      if (!fr) throw new TRPCError({ code: "NOT_FOUND" });

      const member = await ctx.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: { userId: ctx.session.user.id, workspaceId: fr.project.workspaceId },
        },
      });

      if (!member) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this workspace." });
      }

      await ctx.prisma.featureRequest.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.context !== undefined && { context: input.context }),
        },
      });
      return { success: true };
    }),
});
