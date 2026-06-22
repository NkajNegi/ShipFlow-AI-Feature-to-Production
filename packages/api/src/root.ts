import { createTRPCRouter, publicProcedure } from "./trpc";
import { z } from "zod";
import { workspaceRouter } from "./routers/workspace";
import { projectRouter } from "./routers/project";
import { featureRequestRouter } from "./routers/featureRequest";
import { taskRouter } from "./routers/task";
import { prdRouter } from "./routers/prd";

// Create a simple dummy router to verify end-to-end functionality
const helloRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
});

export const appRouter = createTRPCRouter({
  hello: helloRouter,
  workspace: workspaceRouter,
  project: projectRouter,
  featureRequest: featureRequestRouter,
  task: taskRouter,
  prd: prdRouter,
});

export type AppRouter = typeof appRouter;
