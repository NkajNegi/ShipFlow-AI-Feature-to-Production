import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertProjectAccess } from "../lib/access";

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
});
