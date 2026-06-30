import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertWorkspaceMember } from "../lib/access";

const FREE_PROJECT_LIMIT = 3;

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({ workspaceId: z.string(), name: z.string().min(1).max(120) }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );

      // Enforce the Free-tier project limit (billing constraint).
      const workspace = await ctx.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: { planTier: true, _count: { select: { projects: true } } },
      });
      if (
        workspace?.planTier === "FREE" &&
        workspace._count.projects >= FREE_PROJECT_LIMIT
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Free plan is limited to ${FREE_PROJECT_LIMIT} projects. Upgrade to Pro for unlimited projects.`,
        });
      }

      return ctx.prisma.project.create({
        data: { name: input.name, workspaceId: input.workspaceId },
      });
    }),

  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );
      return ctx.prisma.project.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { createdAt: "desc" },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.id },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const member = await ctx.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.session.user.id,
            workspaceId: project.workspaceId,
          },
        },
      });

      if (!member || (member.role !== "ADMIN" && member.role !== "LEAD")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only an Admin or Lead can delete a project.",
        });
      }

      await ctx.prisma.project.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
