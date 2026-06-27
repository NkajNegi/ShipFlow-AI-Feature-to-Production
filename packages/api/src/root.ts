import { createTRPCRouter } from "./trpc";
import { workspaceRouter } from "./routers/workspace";
import { projectRouter } from "./routers/project";
import { featureRequestRouter } from "./routers/featureRequest";
import { taskRouter } from "./routers/task";
import { commentRouter } from "./routers/comment";
import { labelRouter } from "./routers/label";
import { prdRouter } from "./routers/prd";
import { githubRouter } from "./routers/github";
import { reviewRouter } from "./routers/review";
import { billingRouter } from "./routers/billing";
import { clarifyRouter } from "./routers/clarify";
import { memberRouter } from "./routers/member";
import { workflowRouter } from "./routers/workflow";
import { profileRouter } from "./routers/profile";
import { commitRouter } from "./routers/commit";

export const appRouter = createTRPCRouter({
  workspace: workspaceRouter,
  project: projectRouter,
  featureRequest: featureRequestRouter,
  task: taskRouter,
  comment: commentRouter,
  label: labelRouter,
  prd: prdRouter,
  github: githubRouter,
  review: reviewRouter,
  billing: billingRouter,
  clarify: clarifyRouter,
  member: memberRouter,
  workflow: workflowRouter,
  profile: profileRouter,
  commit: commitRouter,
});

export type AppRouter = typeof appRouter;
