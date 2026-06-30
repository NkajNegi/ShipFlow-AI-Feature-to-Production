import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertWorkspaceMember } from "../lib/access";
import { encryptSecret, decryptSecret, maskKey } from "../lib/crypto";
import { assertAnthropicKeyHasStrongModel } from "../lib/ai";

export const workspaceRouter = createTRPCRouter({
  getUserWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.workspace.findMany({
      where: {
        members: { some: { userId: ctx.session.user.id } },
      },
      include: { members: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const member = await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );
      // Explicit select so the encrypted API key never leaves the server.
      const workspace = await ctx.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: {
          id: true,
          name: true,
          planTier: true,
          aiReviewCredits: true,
          githubInstallationId: true,
          githubAccountLogin: true,
          createdAt: true,
        },
      });
      return { ...workspace, currentUserRole: member.role };
    }),

  getMembers: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );
      return ctx.prisma.workspaceMember.findMany({
        where: { workspaceId: input.workspaceId },
        include: { user: { select: { name: true, email: true, image: true } } },
        orderBy: { createdAt: "asc" },
      });
    }),

  createWorkspace: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Workspace name is required").max(120),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.workspace.create({
        data: {
          name: input.name,
          members: {
            create: { userId: ctx.session.user.id, role: "ADMIN" },
          },
        },
      });
    }),

  // --- Bring-your-own AI key (Anthropic / Claude only) ---------------------

  getAiKeyStatus: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );
      const ws = await ctx.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: { anthropicApiKeyEnc: true, openRouterApiKeyEnc: true },
      });
      const enc = ws?.anthropicApiKeyEnc;
      let masked: string | null = null;
      if (enc) {
        try {
          masked = maskKey(decryptSecret(enc));
        } catch {
          masked = "••••";
        }
      }
      const orEnc = ws?.openRouterApiKeyEnc;
      let orMasked: string | null = null;
      if (orEnc) {
        try {
          orMasked = maskKey(decryptSecret(orEnc));
        } catch {
          orMasked = "••••";
        }
      }
      return {
        hasKey: Boolean(enc),
        maskedKey: masked,
        hasOpenRouterKey: Boolean(orEnc),
        openRouterMaskedKey: orMasked,
      };
    }),

  setAnthropicKey: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        apiKey: z.string().min(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN"],
      );

      const key = input.apiKey.trim();
      // Validates the key live and confirms Claude Opus access (Opus-only policy).
      await assertAnthropicKeyHasStrongModel(key);

      await ctx.prisma.workspace.update({
        where: { id: input.workspaceId },
        data: { anthropicApiKeyEnc: encryptSecret(key) },
      });

      return { ok: true, maskedKey: maskKey(key) };
    }),

  removeAnthropicKey: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN"],
      );
      await ctx.prisma.workspace.update({
        where: { id: input.workspaceId },
        data: { anthropicApiKeyEnc: null },
      });
      return { success: true };
    }),

  setOpenRouterKey: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        apiKey: z.string().min(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN"],
      );

      const key = input.apiKey.trim();
      await ctx.prisma.workspace.update({
        where: { id: input.workspaceId },
        data: { openRouterApiKeyEnc: encryptSecret(key) },
      });

      return { ok: true, maskedKey: maskKey(key) };
    }),

  removeOpenRouterKey: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN"],
      );
      await ctx.prisma.workspace.update({
        where: { id: input.workspaceId },
        data: { openRouterApiKeyEnc: null },
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.session.user.id,
            workspaceId: input.id,
          },
        },
      });

      if (!member || (member.role !== "ADMIN" && member.role !== "LEAD")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only an Admin or Lead can delete the workspace.",
        });
      }

      await ctx.prisma.workspace.delete({ where: { id: input.id } });
      return { success: true };
    }),

  /** Recent audit entries (approvals, role changes, removals, invites). */
  getAuditLog: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN", "LEAD"],
      );
      return ctx.prisma.auditLog.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }),

  // --- Notifications (Slack / Discord) -------------------------------------

  getNotifyStatus: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );
      const ws = await ctx.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: { notifyWebhookUrl: true, notifyType: true },
      });
      return {
        enabled: Boolean(ws?.notifyWebhookUrl),
        type: ws?.notifyType ?? null,
      };
    }),

  setNotifications: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        webhookUrl: z.string().url().max(500).or(z.literal("")),
        type: z.enum(["SLACK", "DISCORD"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN"],
      );
      await ctx.prisma.workspace.update({
        where: { id: input.workspaceId },
        data: {
          notifyWebhookUrl: input.webhookUrl || null,
          notifyType: input.webhookUrl ? input.type : null,
        },
      });
      return { ok: true };
    }),

  // --- Review SLA ----------------------------------------------------------

  getReviewSla: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );
      const ws = await ctx.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: { reviewSlaHours: true },
      });
      return { reviewSlaHours: ws?.reviewSlaHours ?? 24 };
    }),

  setReviewSla: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        hours: z.number().int().min(1).max(720),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN", "LEAD"],
      );
      await ctx.prisma.workspace.update({
        where: { id: input.workspaceId },
        data: { reviewSlaHours: input.hours },
      });
      return { ok: true };
    }),

  // --- Activity feed -------------------------------------------------------

  /**
   * Chronological workspace activity: merges the audit trail (human actions)
   * and workflow runs (AI operations) into a single normalized stream.
   */
  getActivityFeed: protectedProcedure
    .input(z.object({ workspaceId: z.string(), limit: z.number().min(1).max(100).default(40) }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );

      // WorkflowRun has no workspace relation, so scope it via the workspace's
      // feature IDs.
      const features = await ctx.prisma.featureRequest.findMany({
        where: { project: { workspaceId: input.workspaceId } },
        select: { id: true },
      });
      const featureIds = features.map((f) => f.id);

      const [audit, runs] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where: { workspaceId: input.workspaceId },
          orderBy: { createdAt: "desc" },
          take: input.limit,
        }),
        featureIds.length
          ? ctx.prisma.workflowRun.findMany({
              where: { featureRequestId: { in: featureIds } },
              orderBy: { createdAt: "desc" },
              take: input.limit,
              select: {
                id: true,
                type: true,
                status: true,
                label: true,
                createdAt: true,
              },
            })
          : Promise.resolve([]),
      ]);

      const items = [
        ...audit.map((a) => ({
          id: `audit-${a.id}`,
          kind: "human" as const,
          actor: a.actorName ?? "A teammate",
          summary: a.action,
          target: a.target ?? null,
          at: a.createdAt,
        })),
        ...runs.map((r) => ({
          id: `run-${r.id}`,
          kind: "ai" as const,
          actor: "MetroFlow AI",
          summary: `${r.type}${r.status ? ` · ${r.status}` : ""}`,
          target: r.label ?? null,
          at: r.createdAt,
        })),
      ]
        .sort((a, b) => b.at.getTime() - a.at.getTime())
        .slice(0, input.limit);

      return { items };
    }),
});
