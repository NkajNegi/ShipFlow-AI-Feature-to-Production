import { createAnthropic } from "@ai-sdk/anthropic";
import { decryptSecret } from "./crypto";

/**
 * Central AI model resolution.
 *
 * ShipFlow only supports Anthropic Claude. We default to Sonnet for its superior
 * code-evaluation capabilities; override the model id via `AI_MODEL`.
 *
 * Bring-your-own-key: if a workspace has stored its own (encrypted) Anthropic
 * key, we use it; otherwise we fall back to the platform's `ANTHROPIC_API_KEY`.
 */
export const AI_MODEL_ID = process.env.AI_MODEL || "claude-3-5-sonnet-latest";

/**
 * Build a Claude model. Pass a workspace's encrypted key to bill the user's own
 * Anthropic account; omit it to use the platform key.
 */
export function resolveModel(encryptedKey?: string | null) {
  const apiKey = encryptedKey
    ? decryptSecret(encryptedKey)
    : process.env.ANTHROPIC_API_KEY;
  const provider = createAnthropic({ apiKey });
  return provider(AI_MODEL_ID);
}

/** Default platform model (uses the env key). */
export const aiModel = resolveModel();
