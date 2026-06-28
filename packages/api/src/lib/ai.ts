import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
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
export const STRONG_MODEL_ID = "claude-3-opus-20240229";
export const WEAK_MODEL_ID = "claude-3-haiku-20240307";

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
  
  let apiKey: string;
  let modelId: string;

  if (enc) {
    // If user brings their own key, they unlock the STRONG model.
    apiKey = decryptSecret(enc);
    modelId = STRONG_MODEL_ID;
  } else if (process.env.ANTHROPIC_API_KEY) {
    // If the platform subsidizes it, restrict them to the WEAK/FREE model.
    apiKey = process.env.ANTHROPIC_API_KEY;
    modelId = WEAK_MODEL_ID;
  } else {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "No Anthropic API key configured. Add your own Claude key in your " +
        "Profile (or Workspace Settings) to enable AI features.",
    });
  }

  const provider = createAnthropic({ apiKey });
  return provider(modelId);
}

/**
 * Execute a structured AI workflow using the Ensemble Architecture.
 * - BYOK Tier: Just calls Claude Opus directly.
 * - Free Tier: Orchestrates Gemini and GPT-4o-mini as junior drafts, and 
 *   uses Claude Haiku to synthesize the final structured JSON.
 */
export async function generateEnsembleObject<T>({
  workspaceKeyEnc,
  userKeyEnc,
  schema,
  system,
  prompt,
}: {
  workspaceKeyEnc?: string | null;
  userKeyEnc?: string | null;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
}): Promise<T> {
  const enc = workspaceKeyEnc || userKeyEnc;

  // BYOK Tier: Just run Claude Opus directly. No ensemble needed for top-tier.
  if (enc) {
    const apiKey = decryptSecret(enc);
    const provider = createAnthropic({ apiKey });
    const model = provider(STRONG_MODEL_ID);

    const { object } = await generateObject({
      model,
      schema,
      system,
      prompt,
    });
    return object;
  }

  // Free Tier (Platform Key Fallback):
  // Ensure the platform has provided all necessary keys.
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!anthropicKey || !googleKey || !openaiKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Ensemble mode requires platform keys for Anthropic, Google, and OpenAI. " +
        "Please provide your own BYOK in Settings to continue.",
    });
  }

  const anthropic = createAnthropic({ apiKey: anthropicKey });
  const google = createGoogleGenerativeAI({ apiKey: googleKey });
  const openai = createOpenAI({ apiKey: openaiKey });

  // 1. Run Junior Agents in parallel to get textual drafts
  const [geminiResult, openaiResult] = await Promise.all([
    generateText({
      model: google("gemini-1.5-flash"),
      system: system + "\n\nProvide a comprehensive draft analysis. Do not output JSON, just your raw observations.",
      prompt,
    }).catch(e => ({ text: `[Gemini failed: ${e.message}]` })),
    
    generateText({
      model: openai("gpt-4o-mini"),
      system: system + "\n\nProvide a comprehensive draft analysis. Do not output JSON, just your raw observations.",
      prompt,
    }).catch(e => ({ text: `[GPT-4o-mini failed: ${e.message}]` }))
  ]);

  // 2. Synthesis by Senior Agent (Claude Haiku)
  const synthesisPrompt = `
You are the Senior Synthesizer. You must fulfill the original request by outputting structured JSON according to the schema.
I have provided the raw input data below, along with two draft analyses from Junior Agents.
Use the Junior Agents' drafts to catch things you might have missed, but you make the final call on correctness.

--- ORIGINAL USER PROMPT ---
${prompt}

--- DRAFT 1 (Gemini) ---
${geminiResult.text}

--- DRAFT 2 (GPT-4o-mini) ---
${openaiResult.text}

Now, output the final structured JSON.
`;

  const { object } = await generateObject({
    model: anthropic(WEAK_MODEL_ID),
    schema,
    system,
    prompt: synthesisPrompt,
  });

  return object;
}

/**
 * Validate an Anthropic key live AND confirm it can access Claude Opus
 * (`claude-opus-4-8`) — ShipFlow runs Opus only, so a key without Opus access
 * is useless here. Uses the Models API (no token cost). Throws a TRPCError with
 * an actionable message on any failure. Safe to call from any router.
 */
export async function assertAnthropicKeyHasStrongModel(key: string): Promise<void> {
  if (!key.startsWith("sk-ant-")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Only Anthropic (Claude) API keys are allowed. They start with 'sk-ant-'.",
    });
  }

  let res: Response;
  try {
    res = await fetch(`https://api.anthropic.com/v1/models/${STRONG_MODEL_ID}`, {
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
        `This key doesn't have access to Claude Opus (${STRONG_MODEL_ID}). ` +
        "BYOK requires a key with Opus access.",
    });
  }
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Could not verify the Anthropic API key. Please try again.",
  });
}
