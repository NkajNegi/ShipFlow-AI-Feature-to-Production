import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { encryptSecret, decryptSecret, maskKey } from "../lib/crypto";
import { assertAnthropicKeyHasOpus } from "../lib/ai";

/**
 * Personal profile: view/edit the signed-in user's display name and avatar, and
 * manage their per-user Anthropic (Claude) key. The user key is the default for
 * their AI usage; a workspace key overrides it. ShipFlow runs Claude Opus only,
 * so a saved key is verified to have Opus access.
 */
export const profileRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });
    return user;
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(120).optional(),
        // Avatar image URL (empty string clears it). Keep simple — no upload infra.
        image: z.string().url().max(2000).or(z.literal("")).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data: { name?: string; image?: string | null } = {};
      if (input.name !== undefined) data.name = input.name.trim();
      if (input.image !== undefined) data.image = input.image || null;

      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data,
        select: { id: true, name: true, email: true, image: true },
      });
      return user;
    }),

  // --- Per-user bring-your-own AI key (Anthropic / Claude, Opus only) -------

  getAiKeyStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { anthropicApiKeyEnc: true, aiKeyEnabled: true },
    });
    const enc = user?.anthropicApiKeyEnc;
    let masked: string | null = null;
    if (enc) {
      try {
        masked = maskKey(decryptSecret(enc));
      } catch {
        masked = "••••";
      }
    }
    return {
      hasKey: Boolean(enc),
      maskedKey: masked,
      enabled: user?.aiKeyEnabled ?? true,
    };
  }),

  /** Turn the personal key on/off without deleting it. */
  setAiKeyEnabled: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { aiKeyEnabled: input.enabled },
      });
      return { ok: true, enabled: input.enabled };
    }),

  setAnthropicKey: protectedProcedure
    .input(z.object({ apiKey: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const key = input.apiKey.trim();
      // Validates the key live and confirms Claude Opus access.
      await assertAnthropicKeyHasOpus(key);

      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { anthropicApiKeyEnc: encryptSecret(key) },
      });
      return { ok: true, maskedKey: maskKey(key) };
    }),

  removeAnthropicKey: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.user.update({
      where: { id: ctx.session.user.id },
      data: { anthropicApiKeyEnc: null },
    });
    return { ok: true };
  }),
});
