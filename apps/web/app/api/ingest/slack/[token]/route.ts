import crypto from "crypto";
import { prisma } from "@repo/db";

export const runtime = "nodejs";

/**
 * Slack intake (Phase 1, "any mode"). Configure a Slack slash command (e.g.
 * `/metroflow`) whose Request URL is:
 *   https://<app>/api/ingest/slack/<project ingest token>
 * The command text becomes a feature request on that project. Requests are
 * verified with the Slack signing secret (SLACK_SIGNING_SECRET).
 *
 * Slack sends an `application/x-www-form-urlencoded` body and expects a fast
 * (<3s) response; the AI discovery work happens later when a user opens the
 * feature, so we just create the record and reply with a confirmation.
 */

function verifySlack(rawBody: string, headers: Headers): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  const signature = headers.get("x-slack-signature");
  const timestamp = headers.get("x-slack-request-timestamp");
  if (!secret || !signature || !timestamp) return false;

  // Replay protection: reject requests older than 5 minutes.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 5) return false;

  const base = `v0:${timestamp}:${rawBody}`;
  const digest =
    "v0=" + crypto.createHmac("sha256", secret).update(base).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

function ephemeral(text: string, status = 200) {
  return Response.json({ response_type: "ephemeral", text }, { status });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const rawBody = await req.text();

  if (!verifySlack(rawBody, req.headers)) {
    return ephemeral("Could not verify this Slack request.", 401);
  }

  const form = new URLSearchParams(rawBody);
  const text = (form.get("text") ?? "").trim();
  const userName = form.get("user_name") ?? "someone";

  if (!text) {
    return ephemeral(
      "Usage: `/metroflow <describe the feature you want>`"
    );
  }
  if (text.length > 10000) {
    return ephemeral("That request is too long (max 10,000 characters).");
  }

  const project = await prisma.project.findUnique({
    where: { ingestToken: token },
    select: { id: true, name: true },
  });
  if (!project) {
    return ephemeral("This Slack command isn’t linked to a valid project.", 401);
  }

  // Title = first line / sentence (trimmed); full text kept as context.
  const firstLine = (text.split("\n")[0] || "").slice(0, 200);
  const title = firstLine.length >= 8 ? firstLine : text.slice(0, 200);

  const fr = await prisma.featureRequest.create({
    data: {
      projectId: project.id,
      title,
      context: `Submitted from Slack by ${userName}.\n\n${text}`,
      source: "SLACK",
      status: "DISCOVERY",
    },
  });

  return ephemeral(
    `✅ Feature request created in *${project.name}* and queued for AI discovery.\n` +
      `Track it in MetroFlow (id \`${fr.id}\`).`
  );
}
