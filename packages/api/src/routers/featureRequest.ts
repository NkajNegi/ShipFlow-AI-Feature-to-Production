import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  assertProjectAccess,
  assertWorkspaceMember,
  assertFeatureRequestAccess,
} from "../lib/access";
import { logAudit, logActivity } from "../lib/audit";
import { generateApprovalBriefing } from "../lib/approval";

export const featureRequestRouter = createTRPCRouter({
  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/projects/{projectId}/features",
        tags: ["Features"],
        summary: "Create a feature request",
        protect: true,
      },
    })
    .input(
      z.object({
        projectId: z.string(),
        title: z.string().min(1).max(200),
        context: z.string().min(1).max(10000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.projectId,
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
   * Human PM approves the AI-generated PRD (or manual tasks) and moves the
   * feature from PLANNING to PLAN_APPROVED (ready for development).
   */
  approvePlan: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const fr = await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.featureRequestId,
        ["ADMIN", "LEAD"],
      );

      const feature = await ctx.prisma.featureRequest.findUnique({
        where: { id: input.featureRequestId },
        select: {
          id: true,
          title: true,
          status: true,
          projectId: true,
          _count: { select: { prds: true } },
        },
      });
      if (!feature) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature not found.",
        });
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
        data: { 
          status: "PLAN_APPROVED",
          featureApprovals: {
            create: {
              type: "PLAN",
              approvedById: ctx.session.user.id,
            }
          }
        },
      });

      await logAudit({
        workspaceId: fr.project.workspaceId,
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        action: "PLAN_APPROVED",
        target: updated.title,
      });

      await logActivity({
        workspaceId: fr.project.workspaceId,
        projectId: updated.projectId,
        userId: ctx.session.user.id,
        type: "PLAN_APPROVED",
        metadata: {
          featureRequestId: updated.id,
          featureRequestTitle: updated.title,
        },
      });

      return updated;
    }),

  getApprovalBriefing: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      const fr = await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.featureRequestId,
        ["ADMIN", "LEAD", "MEMBER"],
      );

      const feature = await ctx.prisma.featureRequest.findUnique({
        where: { id: input.featureRequestId },
        include: {
          prds: { orderBy: { createdAt: "desc" }, take: 1 },
          pullRequests: {
            include: {
              reviews: {
                orderBy: { createdAt: "desc" },
                select: { id: true, createdAt: true, status: true, issuesJson: true, iteration: true },
              },
            },
          },
        },
      });

      if (!feature) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature not found.",
        });
      }

      // Collect review history
      const reviewHistory = (feature as any).pullRequests.flatMap((pr: any) => 
        pr.reviews.map((r: any) => ({
          iteration: r.iteration,
          summary: `Status: ${r.status}, Issues: ${Array.isArray(r.issuesJson) ? r.issuesJson.length : 0}`,
          issues: Array.isArray(r.issuesJson) ? r.issuesJson : []
        }))
      );

      return generateApprovalBriefing(
        fr.project.workspaceId,
        ctx.session.user.id,
        { title: feature.title, context: feature.context },
        feature.prds[0]?.contentJson ? JSON.stringify(feature.prds[0]?.contentJson) : null,
        reviewHistory
      );
    }),

  list: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/projects/{projectId}/features",
        tags: ["Features"],
        summary: "List features for a project",
        protect: true,
      },
    })
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProjectAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.projectId,
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
        input.workspaceId,
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
          shippedAt: true,
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
          userId_workspaceId: {
            userId: ctx.session.user.id,
            workspaceId: fr.project.workspaceId,
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this workspace.",
        });
      }

      await ctx.prisma.featureRequest.delete({ where: { id: input.id } });
      return { success: true };
    }),

  update: protectedProcedure
    .meta({
      openapi: {
        method: "PUT",
        path: "/features/{id}",
        tags: ["Features"],
        summary: "Update a feature request",
        protect: true,
      },
    })
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        context: z.string().min(1).max(10000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fr = await ctx.prisma.featureRequest.findUnique({
        where: { id: input.id },
        include: { project: true },
      });
      if (!fr) throw new TRPCError({ code: "NOT_FOUND" });

      const member = await ctx.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.session.user.id,
            workspaceId: fr.project.workspaceId,
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this workspace.",
        });
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
