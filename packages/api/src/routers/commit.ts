import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { inngest, EVENTS } from "@repo/inngest";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertWorkspaceMember } from "../lib/access";
import { getInstallationOctokit } from "../lib/github";
import { enforceRateLimit } from "../lib/ratelimit";

/**
 * Commit review: fetch a linked repository's recent commits, then run an AI
 * review (flaws + improvements) over a chosen commit's diff. Independent of
 * pull requests and PRDs. The AI work is queued to Inngest and persisted; the
 * UI polls `getReview` for the result.
 */

/** Load a repository + its workspace, asserting the caller is a member. */
async function repoWithWorkspace(
  prisma: any,
  userId: string,
  repositoryId: string
) {
  const repo = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: {
      id: true,
      fullName: true,
      project: {
        select: {
          workspaceId: true,
          workspace: { select: { githubInstallationId: true } },
        },
      },
    },
  });
  if (!repo) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found." });
  }
  await assertWorkspaceMember(prisma, userId, repo.project.workspaceId);
  return repo;
}

export const commitRouter = createTRPCRouter({
  /** Recent commits for a linked repository (live, via Octokit). */
  listCommits: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        perPage: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const repo = await repoWithWorkspace(
        ctx.prisma,
        ctx.session.user.id,
        input.repositoryId
      );
      const installationId = repo.project.workspace.githubInstallationId;
      if (!installationId || !repo.fullName) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub is not connected for this workspace.",
        });
      }
      const [owner, name] = repo.fullName.split("/");
      const octokit = getInstallationOctokit(installationId);
      const res = await octokit.rest.repos.listCommits({
        owner,
        repo: name,
        per_page: input.perPage,
      });
      return res.data.map((c) => ({
        sha: c.sha,
        message: c.commit.message,
        authorName: c.commit.author?.name ?? c.author?.login ?? null,
        date: c.commit.author?.date ?? null,
        htmlUrl: c.html_url,
      }));
    }),

  /**
   * Queue an AI review of a commit. With no `sha`, reviews the most recent
   * commit on the default branch. Returns the CommitReview id to poll.
   */
  reviewCommit: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        sha: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const repo = await repoWithWorkspace(
        ctx.prisma,
        ctx.session.user.id,
        input.repositoryId
      );
      const installationId = repo.project.workspace.githubInstallationId;
      if (!installationId || !repo.fullName) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub is not connected for this workspace.",
        });
      }

      await enforceRateLimit(
        ctx.prisma,
        `ai:commit:${ctx.session.user.id}`,
        15,
        60
      );

      const [owner, name] = repo.fullName.split("/");
      const octokit = getInstallationOctokit(installationId);

      // Resolve the target commit (latest on default branch if no sha given).
      const commit = input.sha
        ? await octokit.rest.repos
            .getCommit({ owner, repo: name, ref: input.sha })
            .then((r) => r.data)
        : await octokit.rest.repos
            .listCommits({ owner, repo: name, per_page: 1 })
            .then((r) => r.data[0]);

      if (!commit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No commit found to review.",
        });
      }

      // Upsert a PENDING review (re-review resets a previous result for this sha).
      const cr = await ctx.prisma.commitReview.upsert({
        where: {
          repositoryId_sha: { repositoryId: repo.id, sha: commit.sha },
        },
        update: {
          status: "PENDING",
          summary: null,
          findingsJson: undefined,
          error: null,
          requestedById: ctx.session.user.id,
        },
        create: {
          repositoryId: repo.id,
          sha: commit.sha,
          message: commit.commit.message,
          authorName:
            commit.commit.author?.name ?? commit.author?.login ?? null,
          htmlUrl: commit.html_url,
          requestedById: ctx.session.user.id,
        },
      });

      await inngest.send({
        name: EVENTS.COMMIT_REVIEW,
        data: { commitReviewId: cr.id },
      });

      return { commitReviewId: cr.id, sha: commit.sha };
    }),

  /** Fetch a single stored commit review (poll target). */
  getReview: protectedProcedure
    .input(z.object({ repositoryId: z.string(), sha: z.string() }))
    .query(async ({ ctx, input }) => {
      await repoWithWorkspace(
        ctx.prisma,
        ctx.session.user.id,
        input.repositoryId
      );
      return ctx.prisma.commitReview.findUnique({
        where: {
          repositoryId_sha: {
            repositoryId: input.repositoryId,
            sha: input.sha,
          },
        },
      });
    }),

  /** Recent commit reviews for a repository. */
  listReviews: protectedProcedure
    .input(z.object({ repositoryId: z.string() }))
    .query(async ({ ctx, input }) => {
      await repoWithWorkspace(
        ctx.prisma,
        ctx.session.user.id,
        input.repositoryId
      );
      return ctx.prisma.commitReview.findMany({
        where: { repositoryId: input.repositoryId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    }),
});
