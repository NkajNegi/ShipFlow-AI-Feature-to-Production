import { prisma } from "@repo/db";

/**
 * Send a notification to a workspace's configured Slack or Discord incoming
 * webhook. Best-effort: failures are swallowed so they never break a workflow.
 */
export async function notifyWorkspace(workspaceId: string, text: string) {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { notifyWebhookUrl: true, notifyType: true },
  });
  if (!ws?.notifyWebhookUrl) return;

  // Slack expects { text }, Discord expects { content }.
  const body =
    ws.notifyType === "DISCORD" ? { content: text } : { text };

  try {
    await fetch(ws.notifyWebhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // ignore network/webhook failures
  }
}
