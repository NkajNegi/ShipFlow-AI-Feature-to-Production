import { prisma } from "@repo/db";
import { inngest, EVENTS } from "@repo/inngest";
import { generatePrdForFeature } from "../lib/prd";
import { runReviewForPullRequest } from "../lib/review";
import { analyzeRepository } from "../lib/repo";
import { runCommitReview } from "../lib/commitReview";

/**
 * Inngest workflow functions (async, durable, retryable).
 *
 * These are registered by the web app's `/api/inngest` route. Producers send
 * the corresponding events (see `EVENTS`) from tRPC routers and the GitHub
 * webhook; Inngest then executes the long-running AI work out of band so it
 * doesn't block the request or hit serverless timeouts.
 */

export const generatePrdFn = inngest.createFunction(
  { id: "generate-prd", name: "Generate PRD", retries: 2 },
  { event: EVENTS.PRD_GENERATE },
  async ({ event, step }) => {
    const { featureRequestId } = event.data;
    const prd = await step.run("generate-prd", () =>
      generatePrdForFeature(featureRequestId)
    );
    return { prdId: prd.id };
  }
);

export const runReviewFn = inngest.createFunction(
  { id: "run-ai-review", name: "Run AI Code Review", retries: 2 },
  { event: EVENTS.REVIEW_RUN },
  async ({ event, step }) => {
    const { pullRequestId } = event.data;
    const reviewId = await step.run("run-review", () =>
      runReviewForPullRequest(pullRequestId)
    );
    return { reviewId };
  }
);

export const repoAnalyzeFn = inngest.createFunction(
  { id: "analyze-repository", name: "Analyze Repository", retries: 2 },
  { event: EVENTS.REPO_ANALYZE },
  async ({ event, step }) => {
    const { repositoryId } = event.data;
    const id = await step.run("analyze-repo", () =>
      analyzeRepository(repositoryId)
    );
    return { repositoryId: id };
  }
);

export const runCommitReviewFn = inngest.createFunction(
  { id: "run-commit-review", name: "Run AI Commit Review", retries: 2 },
  { event: EVENTS.COMMIT_REVIEW },
  async ({ event, step }) => {
    const { commitReviewId } = event.data;
    const id = await step.run("run-commit-review", () =>
      runCommitReview(commitReviewId)
    );
    return { commitReviewId: id };
  }
);

// Hourly housekeeping: prune expired rate-limit buckets and old records.
export const cleanupFn = inngest.createFunction(
  { id: "housekeeping-cleanup" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    await step.run("prune", async () => {
      const now = new Date();
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
      await prisma.workflowRun.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      await prisma.webhookEvent.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      return { ok: true };
    });
    return { ok: true };
  }
);

export const inngestFunctions = [
  generatePrdFn,
  runReviewFn,
  repoAnalyzeFn,
  runCommitReviewFn,
  cleanupFn,
];
