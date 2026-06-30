import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { inngest, EVENTS } from "@repo/inngest";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  assertFeatureRequestAccess,
  assertWorkspaceMember,
} from "../lib/access";
import { enforceRateLimit } from "../lib/ratelimit";
import { logAudit, logActivity } from "../lib/audit";
import { computeSlaState, SLA_OPEN_STATUSES } from "../lib/sla";
import { formatReviewComment } from "../lib/review";
import { getInstallationOctokit } from "../lib/github";

export const reviewRouter = createTRPCRouter({
  /** Full command-center payload for a feature request (Phase 5 aggregation). */
  getFeatureDetail: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.featureRequestId,
      );
      return ctx.prisma.featureRequest.findUnique({
        where: { id: input.featureRequestId },
        include: {
          project: { select: { id: true, name: true, workspaceId: true } },
          prds: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { tasks: { orderBy: { ref: "asc" } } },
          },
          pullRequests: {
            orderBy: { createdAt: "desc" },
            include: {
              repository: { select: { fullName: true, url: true } },
              reviews: {
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  status: true,
                  summary: true,
                  issuesJson: true,
                  dimensionsJson: true,
                  blockingCount: true,
                  iteration: true,
                  createdAt: true,
                },
              },
            },
          },
          clarificationMessages: { orderBy: { createdAt: "asc" } },
        },
      });
    }),

  /** Queue an AI review for a pull request as an async Inngest workflow. */
  runReview: protectedProcedure
    .input(z.object({ pullRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pr = await ctx.prisma.pullRequest.findUnique({
        where: { id: input.pullRequestId },
        select: { featureRequestId: true },
      });
      if (!pr) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PR not found." });
      }
      await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        pr.featureRequestId,
      );

      // Throttle manual re-reviews. (The credit itself is consumed when the
      // Inngest workflow actually runs, in runReviewForPullRequest.)
      await enforceRateLimit(
        ctx.prisma,
        `ai:review:${ctx.session.user.id}`,
        20,
        60,
      );

      // Create a PENDING review immediately so the UI shows it's running
      const review = await ctx.prisma.review.create({
        data: {
          pullRequestId: input.pullRequestId,
          status: "PENDING",
        },
      });

      await inngest.send({
        name: EVENTS.REVIEW_RUN,
        data: { pullRequestId: input.pullRequestId, reviewId: review.id },
      });
      return { queued: true };
    }),

  /** Cancel a running AI code review. */
  cancel: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
        include: { pullRequest: true },
      });
      if (!review)
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });

      await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        review.pullRequest.featureRequestId,
      );

      // Delete the pending review row so the UI returns to the "Run Review" state
      await ctx.prisma.review.delete({
        where: { id: input.reviewId },
      });

      await inngest.send({
        name: EVENTS.REVIEW_CANCEL,
        data: { pullRequestId: review.pullRequest.id },
      });

      return { canceled: true };
    }),

  /** Queue an AI release-readiness check for a feature (async Inngest). */
  runReadinessCheck: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.featureRequestId,
      );
      await enforceRateLimit(
        ctx.prisma,
        `ai:readiness:${ctx.session.user.id}`,
        15,
        60,
      );
      await ctx.prisma.featureRequest.update({
        where: { id: input.featureRequestId },
        data: { readinessStatus: "PENDING" },
      });
      await inngest.send({
        name: EVENTS.READINESS_CHECK,
        data: { featureRequestId: input.featureRequestId },
      });
      return { queued: true };
    }),

  /**
   * Phase 5 — human approval. Only ADMIN or LEAD may approve. Blocks release if
   * any pull request still has unresolved blocking issues.
   */
  approveAndShip: protectedProcedure
    .input(
      z.object({
        featureRequestId: z.string(),
        mergePr: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fr = await ctx.prisma.featureRequest.findUnique({
        where: { id: input.featureRequestId },
        select: {
          id: true,
          project: { select: { workspaceId: true } },
          pullRequests: {
            include: { reviews: { orderBy: { createdAt: "desc" }, take: 1 } },
          },
        },
      });
      if (!fr) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature not found.",
        });
      }

      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        fr.project.workspaceId,
        ["ADMIN", "LEAD"],
      );

      const hasBlocking = fr.pullRequests.some(
        (pr) => (pr.reviews[0]?.blockingCount ?? 0) > 0,
      );
      if (hasBlocking) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Cannot ship: one or more pull requests still have blocking issues.",
        });
      }

      const shippedFr = await ctx.prisma.featureRequest.update({
        where: { id: input.featureRequestId },
        data: {
          status: "SHIPPED",
          approvedById: ctx.session.user.id,
          approvedAt: new Date(),
          shippedAt: new Date(),
          featureApprovals: {
            create: {
              type: "RELEASE",
              approvedById: ctx.session.user.id,
            }
          }
        },
      });
      await logAudit({
        workspaceId: fr.project.workspaceId,
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        action: "FEATURE_SHIPPED",
        target: shippedFr.title,
      });

      await logActivity({
        workspaceId: fr.project.workspaceId,
        projectId: shippedFr.projectId,
        userId: ctx.session.user.id,
        type: "FEATURE_SHIPPED",
        metadata: {
          featureRequestId: shippedFr.id,
          featureRequestTitle: shippedFr.title,
        },
      });
      return shippedFr;
    }),

  reject: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const fr = await assertFeatureRequestAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.featureRequestId,
        ["ADMIN", "LEAD"],
      );
      const rejected = await ctx.prisma.featureRequest.update({
        where: { id: fr.id },
        data: { status: "REJECTED" },
      });
      await logAudit({
        workspaceId: fr.project.workspaceId,
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        action: "FEATURE_REJECTED",
        target: rejected.title,
      });

      await logActivity({
        workspaceId: fr.project.workspaceId,
        projectId: rejected.projectId,
        userId: ctx.session.user.id,
        type: "FEATURE_REJECTED",
        metadata: {
          featureRequestId: rejected.id,
          featureRequestTitle: rejected.title,
        },
      });
      return rejected;
    }),

  /** Dismiss an AI false positive, immediately unblocking the PR and teaching the AI to ignore it. */
  dismissIssue: protectedProcedure
    .input(z.object({ reviewId: z.string(), issueIndex: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
        include: { 
          pullRequest: { 
            include: { 
              repository: true,
              featureRequest: { include: { project: { include: { workspace: { include: { githubInstallations: true } } } } } } 
            } 
          } 
        },
      });
      if (!review) throw new TRPCError({ code: "NOT_FOUND" });

      const workspace = review.pullRequest.featureRequest.project.workspace;
      await assertWorkspaceMember(ctx.prisma, ctx.session.user.id, workspace.id);

      const issues = (Array.isArray(review.issuesJson) ? review.issuesJson : []) as any[];
      const issue = issues[input.issueIndex];
      if (!issue) throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found" });

      // Remove the issue from the list
      issues.splice(input.issueIndex, 1);

      // Recalculate status
      const blockingCount = issues.filter(
        (i: any) => i.severity === "BLOCKING" && i.resolutionStatus !== "RESOLVED",
      ).length;
      const status = blockingCount > 0 ? "CHANGES_REQUESTED" : "APPROVED";

      // Update the review row
      const updatedReview = await ctx.prisma.review.update({
        where: { id: review.id },
        data: { issuesJson: issues, blockingCount, status },
      });

      // Update feature request if this unblocked it
      if (status === "APPROVED") {
        await ctx.prisma.featureRequest.update({
          where: { id: review.pullRequest.featureRequest.id },
          data: { status: "IN_REVIEW" }, // wait, FIX_NEEDED -> IN_REVIEW
        });
      }

      // Create a ReviewRule to teach the AI
      const pattern = `Ignore this false positive: [${issue.category}] ${issue.title}\n${issue.detail}`;
      await ctx.prisma.reviewRule.create({
        data: {
          workspaceId: workspace.id,
          pattern,
          createdBy: ctx.session.user.id,
        },
      });

      // Update the GitHub comment!
      const repo = review.pullRequest.repository;
      const installation = workspace.githubInstallations[0];
      if (installation?.installationId && repo?.fullName) {
        try {
          const parts = repo.fullName.split("/");
          const owner = parts[0] as string;
          const repoName = parts[1] as string;
          const octokit = getInstallationOctokit(installation.installationId);
          const comments = await octokit.paginate(octokit.rest.issues.listComments, {
            owner,
            repo: repoName,
            issue_number: review.pullRequest.number,
          });
          const existingComment = comments.find((c: any) =>
            c.body?.includes("<!-- metroflow-ai-review -->"),
          );
          if (existingComment) {
            // reconstruct the ReviewResult object for formatting
            const result = {
              summary: review.summary || "",
              meetsAcceptanceCriteria: true,
              dimensions: (Array.isArray(review.dimensionsJson) ? review.dimensionsJson : []) as any,
              issues,
              suggestedTests: [],
            };
            const commentBody = formatReviewComment(result as any, blockingCount);
            await octokit.rest.issues.updateComment({
              owner,
              repo: repoName,
              comment_id: existingComment.id,
              body: commentBody,
            });
          }
        } catch (err) {
          // Ignore failures here, we've already done the DB update
          console.error("Failed to update GitHub comment on dismiss", err);
        }
      }

      return updatedReview;
    }),

  /** Velocity & AI metrics for the analytics dashboard. */
  getWorkspaceMetrics: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );

      const shipped = await ctx.prisma.featureRequest.findMany({
        where: {
          project: { workspaceId: input.workspaceId },
          status: "SHIPPED",
          shippedAt: { not: null },
        },
        select: { createdAt: true, shippedAt: true },
      });

      const totalMs = shipped.reduce(
        (acc, f) =>
          acc + ((f.shippedAt?.getTime() ?? 0) - f.createdAt.getTime()),
        0,
      );
      const avgCycleHours =
        shipped.length > 0 ? Math.round(totalMs / shipped.length / 36e5) : 0;

      const reviews = await ctx.prisma.review.findMany({
        where: {
          pullRequest: {
            featureRequest: { project: { workspaceId: input.workspaceId } },
          },
        },
        select: { blockingCount: true, issuesJson: true, iteration: true },
      });

      const bugsCaught = reviews.reduce(
        (acc, r) =>
          acc + (Array.isArray(r.issuesJson) ? r.issuesJson.length : 0),
        0,
      );

      const totalIterations = reviews.reduce(
        (a, r) => a + (r.iteration || 1),
        0,
      );
      const avgIssuesPerIteration =
        totalIterations > 0 ? (bugsCaught / totalIterations).toFixed(1) : 0;
      const passRate =
        reviews.length > 0
          ? (
              (reviews.filter((r) => r.blockingCount === 0).length /
                reviews.length) *
              100
            ).toFixed(0)
          : 0;

      const prs = await ctx.prisma.pullRequest.findMany({
        where: {
          featureRequest: { project: { workspaceId: input.workspaceId } },
        },
        include: {
          reviews: {
            orderBy: { createdAt: "asc" },
            select: { createdAt: true, status: true },
          },
        },
      });

      let totalReviewMs = 0;
      let reviewedPrs = 0;
      for (const pr of prs) {
        if (pr.reviews.length > 0) {
          const firstReview = pr.reviews[0];
          const approvedReview = pr.reviews.find(
            (r) => r.status === "APPROVED",
          );
          if (firstReview && approvedReview) {
            totalReviewMs +=
              approvedReview.createdAt.getTime() -
              firstReview.createdAt.getTime();
            reviewedPrs++;
          }
        }
      }
      const avgTimeInReviewHours =
        reviewedPrs > 0 ? (totalReviewMs / reviewedPrs / 36e5).toFixed(1) : 0;

      return {
        shippedCount: shipped.length,
        avgCycleHours,
        reviewCount: reviews.length,
        bugsCaught,
        blockingCaught: reviews.reduce((a, r) => a + r.blockingCount, 0),
        avgIssuesPerIteration,
        passRate: `${passRate}%`,
        avgTimeInReviewHours,
      };
    }),

  /** Recent AI PR reviews across a workspace (for the Review History page). */
  listForWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );
      return ctx.prisma.review.findMany({
        where: {
          pullRequest: {
            featureRequest: { project: { workspaceId: input.workspaceId } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          summary: true,
          blockingCount: true,
          iteration: true,
          createdAt: true,
          pullRequest: {
            select: {
              number: true,
              title: true,
              url: true,
              featureRequest: { select: { id: true, title: true } },
              repository: { select: { fullName: true } },
            },
          },
        },
      });
    }),

  /**
   * Review SLA board: features currently in review/approval, each with their
   * SLA state (on_track / due_soon / breached), sorted by deadline. Returns
   * summary counts for the dashboard header.
   */
  slaBoard: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
      );

      const ws = await ctx.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: { reviewSlaHours: true },
      });
      const slaHours = ws?.reviewSlaHours ?? 24;

      const features = await ctx.prisma.featureRequest.findMany({
        where: {
          project: { workspaceId: input.workspaceId },
          status: { in: [...SLA_OPEN_STATUSES] as any },
        },
        orderBy: { reviewDueAt: "asc" },
        select: {
          id: true,
          title: true,
          status: true,
          reviewStartedAt: true,
          reviewDueAt: true,
          updatedAt: true,
          project: { select: { id: true, name: true } },
        },
      });

      const now = new Date();
      const items = features.map((f) => {
        const sla = computeSlaState(f.reviewDueAt, f.status, slaHours, now);
        return { ...f, sla };
      });

      const counts = {
        onTrack: items.filter((i) => i.sla.state === "on_track").length,
        dueSoon: items.filter((i) => i.sla.state === "due_soon").length,
        breached: items.filter((i) => i.sla.state === "breached").length,
      };

      return { slaHours, counts, items };
    }),
});
