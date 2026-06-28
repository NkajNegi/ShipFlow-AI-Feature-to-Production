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
 * Tiering:
 *  - BYOK (a workspace or user supplies their own Anthropic key) → Claude Opus,
 *    the flagship model, billed to their own account.
 *  - Default / free tier → Google Gemini and OpenAI working together. NO
 *    Anthropic key is required here.
 *  - Anthropic is used on the platform only if an optional ANTHROPIC_API_KEY is
 *    set (last-resort fallback) — never required for the free tier.
 *
 * Precedence: workspace key → user key → Gemini → OpenAI → platform Anthropic.
 */
export const STRONG_MODEL_ID = "claude-3-opus-20240229"; // BYOK (Anthropic)
export const WEAK_MODEL_ID = "claude-3-haiku-20240307"; // optional platform Anthropic
export const GEMINI_MODEL_ID = "gemini-1.5-flash"; // free-tier default
export const OPENAI_MODEL_ID = "gpt-4o-mini"; // free-tier secondary

/**
 * Build a model for a single (non-ensemble) call such as the discovery chat.
 * BYOK → Claude Opus. Otherwise the free tier: Gemini, then OpenAI, then an
 * optional platform Anthropic key. Throws a friendly error when nothing is set.
 */
export function resolveModel(
  workspaceKeyEnc?: string | null,
  userKeyEnc?: string | null
) {
  const enc = workspaceKeyEnc || userKeyEnc;

  // BYOK: user/workspace brought their own Anthropic key → unlock Opus.
  if (enc) {
    return createAnthropic({ apiKey: decryptSecret(enc) })(STRONG_MODEL_ID);
  }

  // Free tier: Gemini first, then OpenAI (no Anthropic required).
  const googleKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (googleKey) {
    return createGoogleGenerativeAI({ apiKey: googleKey })(GEMINI_MODEL_ID);
  }
  if (process.env.OPENAI_API_KEY) {
    return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(OPENAI_MODEL_ID);
  }

  // Optional last-resort platform Anthropic key.
  if (process.env.ANTHROPIC_API_KEY) {
    return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(
      WEAK_MODEL_ID
    );
  }

  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message:
      "No AI provider configured. Set a platform GOOGLE_GENERATIVE_AI_API_KEY " +
      "and/or OPENAI_API_KEY, or add your own Anthropic key in your Profile " +
      "(or Workspace Settings) to enable AI features.",
  });
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

  // Free Tier: Gemini + OpenAI working together. No Anthropic key required.
  const googleKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!googleKey && !openaiKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "No AI provider configured. Set a platform GOOGLE_GENERATIVE_AI_API_KEY " +
        "and/or OPENAI_API_KEY, or add your own Anthropic key in Settings.",
    });
  }

  const google = googleKey ? createGoogleGenerativeAI({ apiKey: googleKey }) : null;
  const openai = openaiKey ? createOpenAI({ apiKey: openaiKey }) : null;

  // 1. Junior agents draft in parallel (whichever keys are configured).
  const draftSystem =
    system +
    "\n\nProvide a comprehensive draft analysis. Do not output JSON, just your raw observations.";
  const [geminiDraft, openaiDraft] = await Promise.all([
    google
      ? generateText({ model: google(GEMINI_MODEL_ID), system: draftSystem, prompt })
          .then((r) => r.text)
          .catch((e) => `[Gemini draft failed: ${e.message}]`)
      : Promise.resolve(""),
    openai
      ? generateText({ model: openai(OPENAI_MODEL_ID), system: draftSystem, prompt })
          .then((r) => r.text)
          .catch((e) => `[GPT-4o-mini draft failed: ${e.message}]`)
      : Promise.resolve(""),
  ]);

  // 2. Senior synthesizer produces the final structured JSON. Prefer Gemini;
  //    fall back to OpenAI. No Anthropic involved on the free tier.
  const synthModel = google ? google(GEMINI_MODEL_ID) : openai!(OPENAI_MODEL_ID);

  const synthesisPrompt = `You are the Senior Synthesizer. Fulfill the original request by outputting structured data that matches the schema. Use the Junior Agents' drafts below to catch things you might miss, but you make the final call on correctness.

--- ORIGINAL PROMPT ---
${prompt}
${geminiDraft ? `\n--- DRAFT (Gemini) ---\n${geminiDraft}` : ""}
${openaiDraft ? `\n--- DRAFT (GPT-4o-mini) ---\n${openaiDraft}` : ""}
`;

  const { object } = await generateObject({
    model: synthModel,
    schema,
    system,
    prompt: synthesisPrompt,
  });

  return object;
}

/**
 * Validate an Anthropic key live AND confirm it can access Claude Opus
 * (`claude-opus-4-8`) — MetroFlow runs Opus only, so a key without Opus access
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
