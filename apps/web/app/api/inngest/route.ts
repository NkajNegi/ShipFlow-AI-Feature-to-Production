import { serve } from "inngest/next";
import { inngest, inngestFunctions } from "@repo/api";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Inngest endpoint. Inngest calls this route to discover and execute the
 * registered workflow functions (PRD generation, AI code review, etc.).
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
