import { z } from "zod";
import { generateObject } from "ai";
import { getWorkspaceAiModel } from "./ai";

const DuplicateCheckSchema = z.object({
  isDuplicate: z.boolean().describe("True if the new feature is a semantic duplicate of an existing one"),
  similarFeatureId: z.string().nullable().describe("The ID of the existing feature request it duplicates, or null if none"),
  reasoning: z.string().describe("Explanation for why it is or is not a duplicate"),
});

export async function detectSimilarFeatureRequests(
  workspaceId: string,
  userId: string | null,
  newFeature: { title: string; context: string },
  existingFeatures: { id: string; title: string; context: string }[]
) {
  if (existingFeatures.length === 0) {
    return {
      isDuplicate: false,
      similarFeatureId: null,
      reasoning: "No existing features to compare against.",
    };
  }

  const model = await getWorkspaceAiModel(workspaceId, userId ?? "");

  const prompt = `You are a product management assistant. Your task is to determine if a NEW feature request is a semantic duplicate of any EXISTING feature requests in the backlog.

NEW FEATURE REQUEST:
Title: ${newFeature.title}
Context: ${newFeature.context}

EXISTING FEATURE REQUESTS:
${existingFeatures
  .map((f) => `--- ID: ${f.id} ---\nTitle: ${f.title}\nContext: ${f.context}`)
  .join("\n\n")}

Analyze the new request against the existing requests.
Are any of the existing requests describing the exact same core feature or solving the exact same problem in a way that renders the new request redundant?
If so, set isDuplicate to true and provide the ID of the most similar existing feature.`;

  const result = await generateObject({
    model,
    schema: DuplicateCheckSchema,
    prompt,
  });

  return result.object;
}
