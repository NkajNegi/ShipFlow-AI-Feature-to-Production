import { prisma } from "@repo/db";

/**
 * Append an entry to the workspace audit trail. Best-effort: never throws into
 * the calling mutation.
 */
export async function logAudit(args: {
  workspaceId: string;
  actorId: string;
  actorName?: string | null;
  action: string;
  target?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId: args.workspaceId,
        actorId: args.actorId,
        actorName: args.actorName ?? null,
        action: args.action,
        target: args.target,
      },
    });
  } catch {
    // auditing must never break the primary action
  }
}

/**
 * Append an entry to the user-facing Activity Feed. Best-effort.
 */
export async function logActivity(args: {
  workspaceId: string;
  projectId?: string | null;
  userId?: string | null;
  type: string;
  metadata?: any;
}) {
  try {
    await prisma.activityEvent.create({
      data: {
        workspaceId: args.workspaceId,
        projectId: args.projectId ?? null,
        userId: args.userId ?? null,
        type: args.type,
        metadata: args.metadata ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
