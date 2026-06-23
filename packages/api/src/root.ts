import { createTRPCRouter } from "./trpc";
import { workspaceRouter } from "./routers/workspace";
import { projectRouter } from "./routers/project";
import { featureRequestRouter } from "./routers/featureRequest";
import { taskRouter } from "./routers/task";
import { prdRouter } from "./routers/prd";
import { githubRouter } from "./routers/github";
import { reviewRouter } from "./routers/review";
import { billingRouter } from "./routers/billing";
import { clarifyRouter } from "./routers/clarify";
import { memberRouter } from "./routers/member";
import { workflowRouter } from "./routers/workflow";

export const appRouter = createTRPCRouter({
  workspace: workspaceRouter,
  project: projectRouter,
  featureRequest: featureRequestRouter,
  task: taskRouter,
  prd: prdRouter,
  github: githubRouter,
  review: reviewRouter,
  billing: billingRouter,
  clarify: clarifyRouter,
  member: memberRouter,
  workflow: workflowRouter,
});

export type AppRouter = typeof appRouter;
