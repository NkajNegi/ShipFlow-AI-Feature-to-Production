import { EventSchemas, Inngest } from "inngest";

/**
 * Typed Inngest event map. This package intentionally has NO dependency on
 * `@repo/api` or `@repo/db` so that producers (tRPC routers, webhooks) can
 * import the client to *send* events without creating a circular dependency.
 * The actual workflow functions live in `@repo/api` and are registered by the
 * web app's `/api/inngest` route.
 */
type Events = {
  "prd/generate.requested": {
    data: { featureRequestId: string; userId?: string };
  };
  "prd/generate.canceled": {
    data: { featureRequestId: string };
  };
  "review/run.requested": {
    data: { pullRequestId: string; reviewId?: string };
  };
  "review/run.canceled": {
    data: { pullRequestId: string };
  };
  "repo/analyze.requested": {
    data: { repositoryId: string };
  };
  "commit/review.requested": {
    data: { commitReviewId: string };
  };
  "readiness/check.requested": {
    data: { featureRequestId: string };
  };
};

export const EVENTS = {
  PRD_GENERATE: "prd/generate.requested",
  PRD_CANCEL: "prd/generate.canceled",
  REVIEW_RUN: "review/run.requested",
  REVIEW_CANCEL: "review/run.canceled",
  REPO_ANALYZE: "repo/analyze.requested",
  COMMIT_REVIEW: "commit/review.requested",
  READINESS_CHECK: "readiness/check.requested",
} as const;

export const inngest = new Inngest({
  id: "shipflow-ai",
  schemas: new EventSchemas().fromRecord<Events>(),
});
