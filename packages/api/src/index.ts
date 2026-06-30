export type { AppRouter } from "./root";
export { appRouter } from "./root";
export { createTRPCContext } from "./trpc";
export { auth } from "./auth";

// Webhook + integration helpers used by Next.js API routes.
export { runReviewForPullRequest } from "./lib/review";
export {
  parseTaskRefs,
  getInstallationOctokit,
  evictInstallationOctokit,
} from "./lib/github";
export {
  activateProForSubscription,
  confirmCreditsPayment,
} from "./lib/billing";
export { alreadyProcessed } from "./lib/webhook";
export { captureError } from "./lib/log";

// Inngest client + registered workflow functions (served by /api/inngest).
export { inngest, EVENTS } from "@repo/inngest";
export { inngestFunctions } from "./inngest/functions";

// Agent / AI SDK Helpers
export { getWorkspaceAiModel } from "./lib/ai";
export { createAgentTools } from "./lib/agent/tools";
export { enforceRateLimit } from "./lib/ratelimit";
export { computeSlaState, formatSlaLabel } from "./lib/sla";

export * from "./lib/agent/tools";
