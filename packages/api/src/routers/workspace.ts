import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const workspaceRouter = createTRPCRouter({
  getUserWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        members: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  createWorkspace: protectedProcedure
    .input(z.object({ name: z.string().min(1, "Workspace name is required") }))
    .mutation(async ({ ctx, input }) => {
      const workspace = await ctx.prisma.workspace.create({
        data: {
          name: input.name,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "ADMIN",
            },
          },
        },
      });

      return workspace;
    }),
});
