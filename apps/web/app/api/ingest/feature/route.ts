import { prisma } from "@repo/db";
import { inngest, EVENTS } from "@repo/inngest";

export const runtime = "nodejs";

/**
 * External feature-request ingestion (Phase 1, "any mode": email, support
 * ticket, customer-service tool, etc.). Authenticated by a per-project ingest
 * token rather than a user session, so upstream systems can POST requests in.
 *
 * POST /api/ingest/feature
 *   { "token": "<project ingest token>",
 *     "title": "...", "context": "...", "source": "EMAIL" | "TICKET" | "API" }
 */
export async function POST(req: Request) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const token = String(payload?.token ?? "");
  const title = String(payload?.title ?? "").trim();
  const context = String(payload?.context ?? "").trim();
  const source = ["EMAIL", "TICKET", "API"].includes(payload?.source)
    ? payload.source
    : "API";

  if (!token || !title || !context) {
    return Response.json(
      { error: "token, title and context are required" },
      { status: 400 },
    );
  }
  if (title.length > 200 || context.length > 10000) {
    return Response.json({ error: "title/context too long" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { ingestToken: token },
    select: { id: true },
  });
  if (!project) {
    return Response.json({ error: "Invalid ingest token" }, { status: 401 });
  }

  const fr = await prisma.featureRequest.create({
    data: {
      projectId: project.id,
      title,
      context,
      source,
      status: "DISCOVERY",
    },
  });

  // Trigger duplicate checking workflow asynchronously
  await inngest.send({
    name: EVENTS.FEATURE_DUPLICATE_CHECK,
    data: { featureRequestId: fr.id },
  });

  return Response.json({ ok: true, featureRequestId: fr.id }, { status: 201 });
}
