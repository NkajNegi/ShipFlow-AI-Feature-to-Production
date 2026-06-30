import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertWorkspaceMember } from "../lib/access";

/**
 * Notifications are DERIVED on read from existing data (audit log + AI reviews
 * with blocking issues) — no separate table, no writes, no migration. The
 * client tracks "seen" locally, so this stays cheap on the free tier.
 */
type Notif = {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  href: string | null;
  createdAt: Date;
};

const AUDIT_META: Record<
  string,
  { type: Notif["type"]; title: string; verb: string }
> = {
  FEATURE_SHIPPED: {
    type: "success",
    title: "Feature shipped",
    verb: "shipped",
  },
  PLAN_APPROVED: {
    type: "info",
    title: "Plan approved",
    verb: "approved the plan for",
  },
  FEATURE_REJECTED: {
    type: "warning",
    title: "Feature rejected",
    verb: "rejected",
  },
  MEMBER_INVITED: { type: "info", title: "Member invited", verb: "invited" },
  MEMBER_REMOVED: { type: "info", title: "Member removed", verb: "removed" },
  ROLE_CHANGED: {
    type: "info",
    title: "Role changed",
    verb: "changed a role for",
  },
};

export const notificationRouter = createTRPCRouter({
  getForWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );

      const [audits, blockingReviews] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where: { workspaceId: input.workspaceId },
          orderBy: { createdAt: "desc" },
          take: 15,
        }),
        ctx.prisma.review.findMany({
          where: {
            blockingCount: { gt: 0 },
            pullRequest: {
              featureRequest: { project: { workspaceId: input.workspaceId } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            blockingCount: true,
            createdAt: true,
            pullRequest: {
              select: {
                number: true,
                featureRequest: { select: { id: true, title: true } },
              },
            },
          },
        }),
      ]);

      const notifs: Notif[] = [];

      for (const a of audits) {
        const meta = AUDIT_META[a.action] ?? {
          type: "info" as const,
          title: a.action.replace(/_/g, " ").toLowerCase(),
          verb: "",
        };
        const who = a.actorName ?? "Someone";
        notifs.push({
          id: `audit-${a.id}`,
          type: meta.type,
          title: meta.title,
          message:
            `${who} ${meta.verb}${a.target ? ` ${a.target}` : ""}`.trim(),
          href: null,
          createdAt: a.createdAt,
        });
      }

      for (const r of blockingReviews) {
        const fr = r.pullRequest?.featureRequest;
        notifs.push({
          id: `review-${r.id}`,
          type: "warning",
          title: `PR #${r.pullRequest?.number} failed AI review`,
          message:
            `${r.blockingCount} blocking issue${r.blockingCount > 1 ? "s" : ""}` +
            (fr ? ` on "${fr.title}"` : ""),
          href: fr ? `/dashboard/${input.workspaceId}/feature/${fr.id}` : null,
          createdAt: r.createdAt,
        });
      }

      notifs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return notifs.slice(0, 20);
    }),
});
