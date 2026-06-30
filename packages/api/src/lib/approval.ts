import { z } from "zod";
import { generateObject } from "ai";
import { getWorkspaceAiModel } from "./ai";

const ApprovalBriefingSchema = z.object({
  executiveSummary: z.string().describe("A short summary of what this feature is and why it's being built"),
  technicalRisks: z.array(z.string()).describe("List of potential technical or product risks based on the PRD and reviews"),
  qaEdgeCases: z.array(z.string()).describe("List of critical QA edge cases to watch out for"),
  overallRecommendation: z.enum(["READY", "NEEDS_WORK", "BLOCKED"]).describe("AI recommendation on whether this should be approved"),
});

export async function generateApprovalBriefing(
  workspaceId: string,
  userId: string,
  feature: { title: string; context: string },
  prdContent: string | null,
  reviewHistory: { iteration: number; summary: string; issues: any[] }[]
) {
  const model = await getWorkspaceAiModel(workspaceId, userId);

  const prompt = `You are a Senior Product/Engineering Manager. You are briefing the Head of Product on a feature that is pending final approval before it is built.

FEATURE:
Title: ${feature.title}
Context: ${feature.context}

PRD:
${prdContent || "No PRD provided."}

REVIEW HISTORY:
${reviewHistory.map(r => `Iteration ${r.iteration}: ${r.summary}`).join("\n") || "No reviews found."}

Based on the above, generate a concise but comprehensive approval briefing. Highlight any critical technical risks or QA edge cases that the team needs to be aware of. Give an overall recommendation on whether this feature is READY to be built, or if it NEEDS_WORK.`;

  const result = await generateObject({
    model,
    schema: ApprovalBriefingSchema,
    prompt,
  });

  return result.object;
}
