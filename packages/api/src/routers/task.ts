import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertWorkspaceMember } from "../lib/access";

export const taskRouter = createTRPCRouter({
  listByWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId
      );
      return ctx.prisma.task.findMany({
        where: {
          prd: {
            featureRequest: {
              project: { workspaceId: input.workspaceId },
            },
          },
        },
        include: {
          prd: {
            include: {
              featureRequest: {
                select: {
                  id: true,
                  title: true,
                  project: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Resolve the owning workspace and enforce membership before mutating.
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.taskId },
        select: {
          prd: {
            select: {
              featureRequest: {
                select: { project: { select: { workspaceId: true } } },
              },
            },
          },
        },
      });
      if (task) {
        await assertWorkspaceMember(
          ctx.prisma,
          ctx.session.user.id,
          task.prd.featureRequest.project.workspaceId
        );
      }
      return ctx.prisma.task.update({
        where: { id: input.taskId },
        data: { status: input.status },
      });
    }),
});
