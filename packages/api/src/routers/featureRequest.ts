import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const featureRequestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ 
      projectId: z.string(), 
      title: z.string().min(1),
      context: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      // Create a feature request
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
      return ctx.prisma.featureRequest.findMany({
        where: {
          projectId: input.projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
});
