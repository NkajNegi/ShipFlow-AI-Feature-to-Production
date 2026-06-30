import { prisma } from "@repo/db";

/**
 * Lightweight workflow-run tracking so async (Inngest) work is visible in-app.
 * Each run records ordered steps and a terminal status.
 */
type RunType = "PRD_GENERATION" | "AI_REVIEW" | "REPO_ANALYSIS" | "CODEGEN";

export async function startRun(
  type: RunType,
  opts: { label?: string; featureRequestId?: string; repositoryId?: string },
) {
  const run = await prisma.workflowRun.create({
    data: {
      type,
      status: "RUNNING",
      label: opts.label,
      featureRequestId: opts.featureRequestId,
      repositoryId: opts.repositoryId,
      stepsJson: [],
    },
  });
  return run.id;
}

export async function addStep(runId: string, label: string) {
  const run = await prisma.workflowRun.findUnique({
    where: { id: runId },
    select: { stepsJson: true },
  });
  const steps = Array.isArray(run?.stepsJson)
    ? (run!.stepsJson as unknown[])
    : [];
  steps.push({ label, at: new Date().toISOString() });
  await prisma.workflowRun.update({
    where: { id: runId },
    data: { stepsJson: steps as object },
  });
}

export async function finishRun(
  runId: string,
  status: "COMPLETED" | "FAILED",
  error?: string,
) {
  await prisma.workflowRun.update({
    where: { id: runId },
    data: { status, error: error?.slice(0, 1000) },
  });
}
