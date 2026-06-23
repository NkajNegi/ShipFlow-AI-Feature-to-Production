import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertWorkspaceMember } from "../lib/access";
import { encryptSecret, decryptSecret, maskKey } from "../lib/crypto";

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
        input.workspaceId
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
        input.workspaceId
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
      })
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
        input.workspaceId
      );
      const ws = await ctx.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: { anthropicApiKeyEnc: true },
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
      return { hasKey: Boolean(enc), maskedKey: masked };
    }),

  setAnthropicKey: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        apiKey: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN"]
      );

      const key = input.apiKey.trim();
      // Anthropic keys only.
      if (!key.startsWith("sk-ant-")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Only Anthropic (Claude) API keys are allowed. They start with 'sk-ant-'.",
        });
      }

      // Validate the key live against Anthropic (no token cost: lists models).
      try {
        const res = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
          },
        });
        if (!res.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "That Anthropic API key was rejected by Anthropic. Please check it and try again.",
          });
        }
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not verify the Anthropic API key. Please try again.",
        });
      }

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
        ["ADMIN"]
      );
      await ctx.prisma.workspace.update({
        where: { id: input.workspaceId },
        data: { anthropicApiKeyEnc: null },
      });
      return { ok: true };
    }),

  /** Recent audit entries (approvals, role changes, removals, invites). */
  getAuditLog: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN", "LEAD"]
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
        input.workspaceId
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN"]
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
});
