import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertProjectAccess, assertWorkspaceMember } from "../lib/access";

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
});
