import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertWorkspaceMember } from "../lib/access";

export const labelRouter = createTRPCRouter({
  listByWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.prisma, ctx.session.user.id, input.workspaceId);
      return ctx.prisma.label.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { createdAt: "asc" }
      });
    }),

  create: protectedProcedure
    .input(z.object({ workspaceId: z.string(), name: z.string(), color: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.prisma, ctx.session.user.id, input.workspaceId);
      return ctx.prisma.label.create({
        data: {
          workspaceId: input.workspaceId,
          name: input.name,
          color: input.color,
        }
      });
    }),
});
