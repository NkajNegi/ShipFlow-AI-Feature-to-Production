import { createAnthropic } from "@ai-sdk/anthropic";
import { TRPCError } from "@trpc/server";
import { decryptSecret } from "./crypto";

/**
 * Central AI model resolution.
 *
 * ShipFlow only supports Anthropic Claude, and by policy only the flagship
 * **Opus** tier — the highest-capability model — is allowed. We pin
 * `claude-opus-4-8` rather than reading an arbitrary `AI_MODEL` override so a
 * bring-your-own key can never silently downgrade the model.
 *
 * Bring-your-own-key precedence: a workspace key overrides a user key, which
 * overrides the optional platform `ANTHROPIC_API_KEY`. None is strictly
 * required — if no key is available we raise a clear, actionable error.
 */
export const AI_MODEL_ID = "claude-opus-4-8";

/**
 * Build a Claude (Opus) model. Pass the workspace key (highest priority) and/or
 * the acting user's key; either is the encrypted form. Falls back to the
 * platform key. Throws a friendly error when no key is available.
 */
export function resolveModel(
  workspaceKeyEnc?: string | null,
  userKeyEnc?: string | null
) {
  const enc = workspaceKeyEnc || userKeyEnc;
  const apiKey = enc ? decryptSecret(enc) : process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "No Anthropic API key configured. Add your own Claude key in your " +
        "Profile (or Workspace Settings) to enable AI features.",
    });
  }

  const provider = createAnthropic({ apiKey });
  return provider(AI_MODEL_ID);
}

/**
 * Validate an Anthropic key live AND confirm it can access Claude Opus
 * (`claude-opus-4-8`) — ShipFlow runs Opus only, so a key without Opus access
 * is useless here. Uses the Models API (no token cost). Throws a TRPCError with
 * an actionable message on any failure. Safe to call from any router.
 */
export async function assertAnthropicKeyHasOpus(key: string): Promise<void> {
  if (!key.startsWith("sk-ant-")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Only Anthropic (Claude) API keys are allowed. They start with 'sk-ant-'.",
    });
  }

  let res: Response;
  try {
    res = await fetch(`https://api.anthropic.com/v1/models/${AI_MODEL_ID}`, {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    });
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Could not reach Anthropic to verify the key. Please try again.",
    });
  }

  if (res.ok) return;

  if (res.status === 401) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "That Anthropic API key was rejected. Please check it and try again.",
    });
  }
  // 403 (no permission) or 404 (model not visible to this key) → no Opus access.
  if (res.status === 403 || res.status === 404) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "This key doesn't have access to Claude Opus (claude-opus-4-8). " +
        "ShipFlow only runs Opus — use a key with Opus access.",
    });
  }
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Could not verify the Anthropic API key. Please try again.",
  });
}
