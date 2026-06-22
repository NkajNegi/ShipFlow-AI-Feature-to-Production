import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ 
      workspaceId: z.string(), 
      name: z.string().min(1) 
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to workspace
      const member = await ctx.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.session.user.id,
            workspaceId: input.workspaceId,
          }
        }
      });

      if (!member) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this workspace" });
      }

      return ctx.prisma.project.create({
        data: {
          name: input.name,
          workspaceId: input.workspaceId,
        },
      });
    }),

  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.project.findMany({
        where: {
          workspaceId: input.workspaceId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
});
