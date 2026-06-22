import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TaskSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const PRDSchema = z.object({
  goals: z.array(z.string()),
  userStories: z.array(z.string()),
  edgeCases: z.array(z.string()),
  tasks: z.array(TaskSchema),
});

export const prdRouter = createTRPCRouter({
  generate: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const featureRequest = await ctx.prisma.featureRequest.findUnique({
        where: { id: input.featureRequestId },
        include: { project: true },
      });

      if (!featureRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Feature request not found" });
      }

      // Generate PRD using Gemini
      const prompt = `You are an expert Product Manager and Staff Software Engineer. 
      Analyze the following feature request and generate a structured Product Requirements Document (PRD) and a list of developer tasks.

      Project Context: ${featureRequest.project.name}
      Feature Title: ${featureRequest.title}
      Feature Details: ${featureRequest.context}

      Respond strictly in JSON format matching this schema:
      {
        "goals": ["Goal 1", "Goal 2"],
        "userStories": ["As a user...", "As an admin..."],
        "edgeCases": ["What if..."],
        "tasks": [
          { "title": "Task 1", "description": "Detailed implementation details" }
        ]
      }`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        });

        const rawJson = response.text || "{}";
        const parsedPRD = JSON.parse(rawJson);
        const validatedPRD = PRDSchema.parse(parsedPRD);

        // Save PRD to DB
        const prd = await ctx.prisma.pRD.create({
          data: {
            featureRequestId: input.featureRequestId,
            contentJson: validatedPRD as any,
          },
        });

        // Create tasks in DB
        const taskPromises = validatedPRD.tasks.map(t => 
          ctx.prisma.task.create({
            data: {
              prdId: prd.id,
              title: t.title,
              description: t.description,
              status: "TODO",
            }
          })
        );
        
        await Promise.all(taskPromises);

        // Update feature request status
        await ctx.prisma.featureRequest.update({
          where: { id: input.featureRequestId },
          data: { status: "PLANNING" },
        });

        return prd;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate PRD: " + error.message,
        });
      }
    }),

  getByFeatureRequest: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.pRD.findFirst({
        where: { featureRequestId: input.featureRequestId },
        orderBy: { createdAt: "desc" },
        include: { tasks: true }
      });
    }),
});
