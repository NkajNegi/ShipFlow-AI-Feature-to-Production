import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const taskRouter = createTRPCRouter({
  listByWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Find all tasks that belong to PRDs in feature requests in projects in this workspace
      return ctx.prisma.task.findMany({
        where: {
          prd: {
            featureRequest: {
              project: {
                workspaceId: input.workspaceId,
              },
            },
          },
        },
        include: {
          prd: {
            include: {
              featureRequest: {
                select: {
                  title: true,
                  project: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(z.object({ taskId: z.string(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.task.update({
        where: { id: input.taskId },
        data: { status: input.status },
      });
    }),
});
