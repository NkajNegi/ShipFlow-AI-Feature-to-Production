import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertWorkspaceMember } from "../lib/access";
import { createRazorpaySubscription } from "../lib/billing";

const PLAN_LIMITS = {
  FREE: { projects: 3, label: "Free" },
  PRO: { projects: Infinity, label: "Pro" },
} as const;

export const billingRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId
      );
      const ws = await ctx.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: {
          planTier: true,
          aiReviewCredits: true,
          subscription: true,
          _count: { select: { projects: true } },
        },
      });
      if (!ws) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found." });
      }
      const tier = (ws.planTier as keyof typeof PLAN_LIMITS) ?? "FREE";
      return {
        planTier: tier,
        planLabel: PLAN_LIMITS[tier].label,
        aiReviewCredits: ws.aiReviewCredits,
        projectCount: ws._count.projects,
        projectLimit: PLAN_LIMITS[tier].projects,
        subscriptionStatus: ws.subscription?.status ?? null,
      };
    }),

  /** Start a Pro subscription via Razorpay; returns the subscription id. */
  upgrade: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN"]
      );
      const sub = await createRazorpaySubscription(input.workspaceId);
      return sub;
    }),
});
