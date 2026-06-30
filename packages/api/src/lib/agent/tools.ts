import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@repo/db";
import { inngest, EVENTS } from "@repo/inngest";
import {
  generateTaskWalkthrough,
  advanceTaskWalkthrough as advanceWalkthroughLib,
} from "../taskWalkthrough";

const ExplainTaskSchema = z.object({
  taskId: z.string().describe("The ID of the engineering task to explain"),
});

const AdvanceWalkthroughSchema = z.object({
  taskId: z.string().describe("The ID of the engineering task"),
  direction: z
    .enum(["next", "prev"])
    .describe("Move the walkthrough cursor forward or back"),
});

/** Confirm a task belongs to the given workspace (prevents cross-tenant access). */
async function taskInWorkspace(taskId: string, workspaceId: string) {
  return prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { project: { workspaceId } },
        { prd: { featureRequest: { project: { workspaceId } } } },
      ],
    },
    select: { id: true },
  });
}

const ListFeaturesSchema = z.object({
  status: z.enum([
    "DISCOVERY",
    "GENERATING_PRD",
    "PLANNING",
    "PLAN_APPROVED", "DUPLICATE_EDUCATION",
    "IN_PROGRESS",
    "IN_REVIEW",
    "FIX_NEEDED",
    "APPROVED",
    "SHIPPED",
    "REJECTED",
  ]).optional().describe("Filter by status"),
  limit: z.number().max(50).default(10).describe("Max features to return"),
});

const GetFeatureSchema = z.object({
  featureRequestId: z.string().describe("The ID of the feature request"),
});

const UpdateFeatureStatusSchema = z.object({
  featureRequestId: z.string().describe("The ID of the feature request"),
  status: z.enum([
    "DISCOVERY",
    "GENERATING_PRD",
    "PLANNING",
    "PLAN_APPROVED", "DUPLICATE_EDUCATION",
    "IN_PROGRESS",
    "IN_REVIEW",
    "FIX_NEEDED",
    "APPROVED",
    "SHIPPED",
    "REJECTED",
  ]),
});

const GeneratePRDSchema = z.object({
  featureRequestId: z.string().describe("The ID of the feature request"),
});

const TriggerAIReviewSchema = z.object({
  featureRequestId: z.string().describe("The ID of the feature request"),
});


/**
 * Creates the core Tool Registry for the AI Agent and MCP Server.
 * All tools are tightly scoped to a specific workspaceId to prevent data leakage.
 */
export const createAgentTools = (workspaceId: string, userId: string) => {
  return {
    listFeatures: tool({
      description: "List feature requests within the workspace.",
      parameters: ListFeaturesSchema,
      // @ts-ignore
      execute: async (args: any) => {
        const { status, limit } = args;
        const features = await prisma.featureRequest.findMany({
          where: {
            project: { workspaceId },
            ...(status && { status }),
          },
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            project: { select: { name: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: limit,
        });
        return { features };
      },
    }),

    getFeature: tool({
      description: "Get detailed information about a specific feature request.",
      parameters: GetFeatureSchema,
      // @ts-ignore
      execute: async (args: any) => {
        const { featureRequestId } = args;
        const feature = await prisma.featureRequest.findFirst({
          where: {
            id: featureRequestId,
            project: { workspaceId },
          },
          include: {
            project: { select: { name: true } },
          },
        });
        
        if (!feature) {
          return { error: "Feature not found or you lack permission." };
        }

        const prd = await prisma.pRD.findFirst({
          where: { featureRequestId },
          orderBy: { createdAt: "desc" },
        });

        return { feature, prd: prd?.contentJson || null };
      },
    }),

    updateFeatureStatus: tool({
      description: "Update the status of a feature request.",
      parameters: UpdateFeatureStatusSchema,
      // @ts-ignore
      execute: async (args: any) => {
        const { featureRequestId, status } = args;
        const feature = await prisma.featureRequest.findFirst({
          where: { id: featureRequestId, project: { workspaceId } },
        });

        if (!feature) {
          return { error: "Feature not found or you lack permission." };
        }

        const updated = await prisma.featureRequest.update({
          where: { id: featureRequestId },
          data: { status },
        });

        return { success: true, newStatus: updated.status };
      },
    }),

    generatePRD: tool({
      description: "Trigger the asynchronous Inngest pipeline to generate a PRD for a feature.",
      parameters: GeneratePRDSchema,
      // @ts-ignore
      execute: async (args: any) => {
        const { featureRequestId } = args;
        const feature = await prisma.featureRequest.findFirst({
          where: { id: featureRequestId, project: { workspaceId } },
        });

        if (!feature) {
          return { error: "Feature not found or you lack permission." };
        }

        await prisma.featureRequest.update({
          where: { id: featureRequestId },
          data: { status: "GENERATING_PRD" },
        });

        await inngest.send({
          name: EVENTS.PRD_GENERATE,
          data: { featureRequestId, userId },
        });

        return { success: true, message: "PRD generation has been queued." };
      },
    }),

    triggerAIReview: tool({
      description: "Trigger an AI Code Review for a specific feature request that has an open PR.",
      parameters: TriggerAIReviewSchema,
      // @ts-ignore
      execute: async (args: any) => {
        const { featureRequestId } = args;
        const feature = await prisma.featureRequest.findFirst({
          where: { id: featureRequestId, project: { workspaceId } },
        });

        if (!feature) {
          return { error: "Feature not found or you lack permission." };
        }

        await prisma.featureRequest.update({
          where: { id: featureRequestId },
          data: { readinessStatus: "PENDING" },
        });

        await inngest.send({
          name: EVENTS.COMMIT_REVIEW,
          data: { commitReviewId: "latest" }, // Just a mock for now
        });

        return { success: true, message: "AI Review has been queued." };
      },
    }),

    explainTask: tool({
      description:
        "Generate a step-by-step AI implementation walkthrough for an engineering task (drafted across multiple providers).",
      parameters: ExplainTaskSchema,
      // @ts-ignore
      execute: async (args: any) => {
        const { taskId } = args;
        if (!(await taskInWorkspace(taskId, workspaceId))) {
          return { error: "Task not found or you lack permission." };
        }
        const walkthrough = await generateTaskWalkthrough(taskId);
        return { walkthrough };
      },
    }),

    advanceTaskWalkthrough: tool({
      description:
        "Move the implementation walkthrough cursor forward or back for a task.",
      parameters: AdvanceWalkthroughSchema,
      // @ts-ignore
      execute: async (args: any) => {
        const { taskId, direction } = args;
        if (!(await taskInWorkspace(taskId, workspaceId))) {
          return { error: "Task not found or you lack permission." };
        }
        return advanceWalkthroughLib(taskId, direction);
      },
    }),
  };
};
