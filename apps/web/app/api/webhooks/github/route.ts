import crypto from "crypto";
import { prisma } from "@repo/db";
import {
  parseTaskRefs,
  inngest,
  EVENTS,
  alreadyProcessed,
  captureError,
  evictInstallationOctokit,
} from "@repo/api";

export const runtime = "nodejs";

/**
 * GitHub webhook listener (Phase 3 + 4).
 *
 * Verifies the payload signature, maps incoming pull_request events to the
 * MetroFlow feature (via "Closes SF-123" task references in the PR body), stores
 * the PR, and kicks off the AI Review Loop.
 *
 * NOTE: In production the review should be offloaded to Inngest to bypass
 * serverless timeouts; here we await it directly for MVP simplicity.
 */
function verifySignature(payload: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifySignature(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Idempotency: GitHub re-delivers events; skip ones we've already handled.
  if (await alreadyProcessed("github", req.headers.get("x-github-delivery"))) {
    return Response.json({ ok: true, deduped: true });
  }

  const event = req.headers.get("x-github-event");
  const payload = JSON.parse(body);

  if (event === "pull_request") {
    const action = payload.action as string;
    if (
      [
        "opened",
        "reopened",
        "synchronize",
        "ready_for_review",
        "closed",
      ].includes(action)
    ) {
      try {
        await handlePullRequest(payload);
      } catch (err) {
        captureError(err, { webhook: "github", action });
      }
    }
  }

  if (event === "installation") {
    if (payload.action === "deleted") {
      const installationId = payload.installation?.id;
      if (installationId) {
        evictInstallationOctokit(installationId);
        await prisma.workspace.updateMany({
          where: { githubInstallationId: installationId },
          data: { githubInstallationId: null },
        });
      }
    }
  }

  if (event === "installation_repositories" && payload.action === "removed") {
    const repos = payload.repositories_removed;
    if (Array.isArray(repos) && repos.length > 0) {
      const fullNames = repos.map((r: any) => r.full_name).filter(Boolean);
      await prisma.repository.deleteMany({
        where: { fullName: { in: fullNames } },
      });
    }
  }

  return Response.json({ ok: true });
}

async function handlePullRequest(payload: any) {
  const pr = payload.pull_request;
  const repoFullName: string = payload.repository?.full_name;
  const refs = parseTaskRefs(pr?.body);
  if (refs.length === 0) return;

  // Map the first referenced MetroFlow task -> its feature request.
  const task = await prisma.task.findFirst({
    where: { ref: { in: refs } },
    select: { prd: { select: { featureRequestId: true } } },
  });
  if (!task) return;

  // The repository must be linked to a project so we can dedupe + read diffs.
  const repository = repoFullName
    ? await prisma.repository.findFirst({ where: { fullName: repoFullName } })
    : null;
  if (!repository) return;

  if (task.prd) {
    const stored = await prisma.pullRequest.upsert({
      where: {
        repositoryId_number: { repositoryId: repository.id, number: pr.number },
      },
      update: {
        title: pr.title,
        url: pr.html_url,
        headSha: pr.head?.sha,
        state: pr.merged ? "MERGED" : pr.state === "closed" ? "CLOSED" : "OPEN",
      },
      create: {
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        headSha: pr.head?.sha,
        state: "OPEN",
        featureRequestId: task.prd.featureRequestId,
        repositoryId: repository.id,
      },
    });

    // Move the feature into development and queue the AI QA pass via Inngest.
    await prisma.featureRequest.update({
      where: { id: task.prd.featureRequestId },
      data: { status: "IN_PROGRESS" },
    });

    await inngest.send({
      name: EVENTS.REVIEW_RUN,
      data: { pullRequestId: stored.id },
    });
  }

  // Update task statuses based on PR state
  const newStatus = pr.merged
    ? "DONE"
    : pr.state === "closed"
      ? "TODO"
      : "REVIEW";
  const taskIdsToUpdate = await prisma.task.findMany({
    where: {
      ref: { in: refs },
      OR: [
        { projectId: repository.projectId },
        { prd: { featureRequest: { projectId: repository.projectId } } },
      ],
    },
    select: { id: true },
  });
  if (taskIdsToUpdate.length > 0) {
    await prisma.task.updateMany({
      where: { id: { in: taskIdsToUpdate.map((t) => t.id) } },
      data: { status: newStatus },
    });
  }
}
