import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertWorkspaceMember } from "../lib/access";

export const commentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ taskId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.taskId },
        include: {
          project: { select: { workspaceId: true } },
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
        const workspaceId =
          task.project?.workspaceId ||
          task.prd?.featureRequest?.project?.workspaceId;
        if (workspaceId)
          await assertWorkspaceMember(
            ctx.prisma,
            ctx.session.user.id,
            workspaceId,
          );
      }
      return ctx.prisma.taskComment.create({
        data: {
          content: input.content,
          taskId: input.taskId,
          authorId: ctx.session.user.id,
        },
      });
    }),

  getRecent: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );

      return ctx.prisma.taskComment.findMany({
        where: {
          OR: [
            { task: { project: { workspaceId: input.workspaceId } } },
            {
              task: {
                prd: {
                  featureRequest: {
                    project: { workspaceId: input.workspaceId },
                  },
                },
              },
            },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { name: true, image: true } },
          task: { select: { id: true, title: true, status: true, ref: true } },
        },
      });
    }),
});
