import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { decryptSecret } from "./crypto";

export const STRONG_MODEL_ID = "claude-3-opus-20240229"; 
export const WEAK_MODEL_ID = "claude-3-haiku-20240307"; 
export const GEMINI_MODEL_ID = "gemini-2.5-pro"; 
export const OPENAI_MODEL_ID = "gpt-4o-mini"; 
export const OPENROUTER_MODEL_ID = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

function googleKey() {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
}

function openRouterProvider(apiKey: string) {
  return createOpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
}

export type AiKeys = {
  anthropicWorkspace?: string | null;
  anthropicUser?: string | null;
  openRouterWorkspace?: string | null;
  openRouterUser?: string | null;
};

export function resolveModel(keys: AiKeys) {
  const antEnc = keys.anthropicWorkspace || keys.anthropicUser;
  if (antEnc) {
    return createAnthropic({ apiKey: decryptSecret(antEnc) })(STRONG_MODEL_ID);
  }

  const orEnc = keys.openRouterWorkspace || keys.openRouterUser;
  if (orEnc) {
    return openRouterProvider(decryptSecret(orEnc))(OPENROUTER_MODEL_ID);
  }

  const gKey = googleKey();
  if (gKey) {
    return createGoogleGenerativeAI({ apiKey: gKey })(GEMINI_MODEL_ID);
  }
  if (process.env.OPENAI_API_KEY) {
    return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(OPENAI_MODEL_ID);
  }
  if (process.env.OPENROUTER_API_KEY) {
    return openRouterProvider(process.env.OPENROUTER_API_KEY)(OPENROUTER_MODEL_ID);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(WEAK_MODEL_ID);
  }

  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message: "No AI provider configured.",
  });
}

/**
 * Ensures we strictly get an OpenRouter model (defaulting to the Critic) for the dual-agent review flow.
 */
export function resolveCriticModel(keys: AiKeys) {
  const orEnc = keys.openRouterWorkspace || keys.openRouterUser;
  if (orEnc) {
    return openRouterProvider(decryptSecret(orEnc))(OPENROUTER_MODEL_ID);
  }
  if (process.env.OPENROUTER_API_KEY) {
    return openRouterProvider(process.env.OPENROUTER_API_KEY)(OPENROUTER_MODEL_ID);
  }
  
  // Fallback to OpenAI if OpenRouter isn't set, as it acts similarly for critic
  if (process.env.OPENAI_API_KEY) {
    return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(OPENAI_MODEL_ID);
  }

  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message: "No OpenRouter/OpenAI provider configured for the Critic agent.",
  });
}

export async function generateEnsembleObject<T>({
  keys,
  schema,
  system,
  prompt,
}: {
  keys: AiKeys;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
}): Promise<T> {
  const antEnc = keys.anthropicWorkspace || keys.anthropicUser;
  if (antEnc) {
    const apiKey = decryptSecret(antEnc);
    const provider = createAnthropic({ apiKey });
    const model = provider(STRONG_MODEL_ID);
    const { object } = await generateObject({ model, schema, system, prompt });
    return object;
  }

  const orEnc = keys.openRouterWorkspace || keys.openRouterUser;
  if (orEnc) {
    const apiKey = decryptSecret(orEnc);
    const provider = openRouterProvider(apiKey);
    const model = provider(OPENROUTER_MODEL_ID);
    const { object } = await generateObject({ model, schema, system, prompt });
    return object;
  }

  const gKey = googleKey();
  const openaiKey = process.env.OPENAI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (!gKey && !openaiKey && !openrouterKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No AI provider configured." });
  }

  const google = gKey ? createGoogleGenerativeAI({ apiKey: gKey }) : null;
  const openai = openaiKey ? createOpenAI({ apiKey: openaiKey }) : null;
  const openrouter = openrouterKey ? openRouterProvider(openrouterKey) : null;

  const draftSystem = system + "\n\nProvide a comprehensive draft analysis. Do not output JSON, just your raw observations.";
  const draft = (label: string, p: Promise<{ text: string }>) => p.then((r) => r.text).catch((e) => `[${label} draft failed: ${e.message}]`);
  
  const [geminiDraft, openaiDraft, openrouterDraft] = await Promise.all([
    google ? draft("Gemini", generateText({ model: google(GEMINI_MODEL_ID), system: draftSystem, prompt })) : Promise.resolve(""),
    openai ? draft("GPT-4o-mini", generateText({ model: openai(OPENAI_MODEL_ID), system: draftSystem, prompt })) : Promise.resolve(""),
    openrouter ? draft("OpenRouter", generateText({ model: openrouter(OPENROUTER_MODEL_ID), system: draftSystem, prompt })) : Promise.resolve(""),
  ]);

  const synthModel = google ? google(GEMINI_MODEL_ID) : openai ? openai(OPENAI_MODEL_ID) : openrouter!(OPENROUTER_MODEL_ID);

  const synthesisPrompt = `You are the Senior Synthesizer. Fulfill the original request by outputting structured data that matches the schema. Use the Junior Agents' drafts below to catch things you might miss, but you make the final call on correctness.

--- ORIGINAL PROMPT ---
${prompt}
${geminiDraft ? `\n--- DRAFT (Gemini) ---\n${geminiDraft}` : ""}
${openaiDraft ? `\n--- DRAFT (GPT-4o-mini) ---\n${openaiDraft}` : ""}
${openrouterDraft ? `\n--- DRAFT (OpenRouter) ---\n${openrouterDraft}` : ""}
`;

  const { object } = await generateObject({
    model: synthModel,
    schema,
    system,
    prompt: synthesisPrompt,
  });

  return object;
}

export async function assertAnthropicKeyHasStrongModel(key: string): Promise<void> {
  if (!key.startsWith("sk-ant-")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Only Anthropic (Claude) API keys are allowed." });
  }
  let res: Response;
  try {
    res = await fetch(`https://api.anthropic.com/v1/models/${STRONG_MODEL_ID}`, {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    });
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Could not reach Anthropic." });
  }
  if (res.ok) return;
  throw new TRPCError({ code: "BAD_REQUEST", message: "That Anthropic API key was rejected." });
}
