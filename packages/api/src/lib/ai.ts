import { createAnthropic } from "@ai-sdk/anthropic";
import { TRPCError } from "@trpc/server";
import { decryptSecret } from "./crypto";

/**
 * Central AI model resolution.
 *
 * ShipFlow only supports Anthropic Claude. We default to Sonnet for its superior
 * code-evaluation capabilities; override the model id via `AI_MODEL`.
 *
 * Bring-your-own-key: if a workspace has stored its own (encrypted) Anthropic
 * key, we use it (billed to the user's account, for their performance and
 * isolation). Otherwise we fall back to the optional platform `ANTHROPIC_API_KEY`.
 * The platform key is NOT required — if neither exists we raise a clear,
 * actionable error pointing the user to Settings → AI Provider Key.
 */
export const AI_MODEL_ID = process.env.AI_MODEL || "claude-3-5-sonnet-latest";

/**
 * Build a Claude model. Pass a workspace's encrypted key to use the user's own
 * Anthropic account; omit it to use the platform key. Throws a friendly error
 * when no key is available so the UI/workflow can tell the user what to do.
 */
export function resolveModel(encryptedKey?: string | null) {
  const apiKey = encryptedKey
    ? decryptSecret(encryptedKey)
    : process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "No Anthropic API key configured for this workspace. Add your own " +
        "Claude key in Settings → AI Provider Key (BYOK) to enable AI features.",
    });
  }

  const provider = createAnthropic({ apiKey });
  return provider(AI_MODEL_ID);
}
