import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { inngest, EVENTS } from "@repo/inngest";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  assertWorkspaceMember,
  assertProjectAccess,
} from "../lib/access";
import { getInstallationOctokit, getInstallUrl, parseTaskRefs } from "../lib/github";
import { enforceRateLimit } from "../lib/ratelimit";
import { assertRepoLimit } from "../lib/plan";

export const githubRouter = createTRPCRouter({
  /** URL to send the user to in order to install the ShipFlow GitHub App. */
  getInstallUrl: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN", "LEAD"]
      );
      // Pass the workspaceId as `state` so the callback can map the installation.
      return { url: getInstallUrl(input.workspaceId) };
    }),

  /** Connection status for a workspace. */
  getStatus: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId
      );
      const ws = await ctx.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: { githubInstallationId: true, githubAccountLogin: true },
      });
      return {
        connected: Boolean(ws?.githubInstallationId),
        accountLogin: ws?.githubAccountLogin ?? null,
      };
    }),

  /** List repositories the installation can access (live, via Octokit). */
  listRepositories: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId
      );
      const ws = await ctx.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: { githubInstallationId: true },
      });
      if (!ws?.githubInstallationId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub is not connected for this workspace.",
        });
      }
      const octokit = getInstallationOctokit(ws.githubInstallationId);
      const res =
        await octokit.rest.apps.listReposAccessibleToInstallation({
          per_page: 100,
        });
      return res.data.repositories.map((r) => ({
        githubId: r.id,
        name: r.name,
        fullName: r.full_name,
        url: r.html_url,
        private: r.private,
      }));
    }),

  /** Link a repository to a project so PRs can be mapped to features. */
  linkRepository: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        workspaceId: z.string().optional(),
        githubId: z.number(),
        name: z.string(),
        fullName: z.string(),
        url: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.projectId && !input.workspaceId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must provide either projectId or workspaceId",
        });
      }

      let finalProjectId = input.projectId;

      if (finalProjectId) {
        await assertProjectAccess(
          ctx.prisma,
          ctx.session.user.id,
          finalProjectId,
          ["ADMIN", "LEAD"]
        );
      } else if (input.workspaceId) {
        await assertWorkspaceMember(
          ctx.prisma,
          ctx.session.user.id,
          input.workspaceId,
          ["ADMIN", "LEAD"]
        );
        // Auto-create a project
        const project = await ctx.prisma.project.create({
          data: {
            name: input.name,
            workspaceId: input.workspaceId,
          },
        });
        finalProjectId = project.id;
      }

      if (!finalProjectId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to resolve project ID",
        });
      }

      // Enforce the per-plan repository limit, but only when connecting a NEW
      // repo — re-linking an already-connected one doesn't add to the count.
      const existing = await ctx.prisma.repository.findUnique({
        where: { githubId: input.githubId },
        select: { id: true },
      });
      if (!existing) {
        const project = await ctx.prisma.project.findUnique({
          where: { id: finalProjectId },
          select: { workspaceId: true },
        });
        if (project) await assertRepoLimit(ctx.prisma, project.workspaceId);
      }

      return ctx.prisma.repository.upsert({
        where: { githubId: input.githubId },
        update: {
          name: input.name,
          fullName: input.fullName,
          url: input.url,
          projectId: finalProjectId,
        },
        create: {
          githubId: input.githubId,
          name: input.name,
          fullName: input.fullName,
          url: input.url,
          projectId: finalProjectId,
        },
      });
    }),

  /** Repositories linked across a workspace, with any AI analysis. */
  listLinkedRepositories: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId
      );
      return ctx.prisma.repository.findMany({
        where: { project: { workspaceId: input.workspaceId } },
        select: {
          id: true,
          name: true,
          fullName: true,
          url: true,
          analysisJson: true,
          analyzedAt: true,
          project: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  /** Queue an AI analysis of a linked repository (async Inngest workflow). */
  analyzeRepository: protectedProcedure
    .input(z.object({ repositoryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = await ctx.prisma.repository.findUnique({
        where: { id: input.repositoryId },
        select: { project: { select: { workspaceId: true } } },
      });
      if (!repo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found." });
      }
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        repo.project.workspaceId,
        ["ADMIN", "LEAD"]
      );
      await enforceRateLimit(
        ctx.prisma,
        `ai:repo:${ctx.session.user.id}`,
        10,
        60
      );
      await inngest.send({
        name: EVENTS.REPO_ANALYZE,
        data: { repositoryId: input.repositoryId },
      });
      return { queued: true };
    }),

  /** Sync existing open pull requests from GitHub into ShipFlow. */
  syncPullRequests: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN", "LEAD"]
      );

      const ws = await ctx.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: { githubInstallationId: true },
      });

      if (!ws?.githubInstallationId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub is not connected for this workspace.",
        });
      }

      const repositories = await ctx.prisma.repository.findMany({
        where: { project: { workspaceId: input.workspaceId } },
      });

      const octokit = getInstallationOctokit(ws.githubInstallationId);
      let syncedCount = 0;

      for (const repo of repositories) {
        const [owner, repoName] = (repo.fullName || "").split("/");
        if (!owner || !repoName) continue;

        try {
          const res = await octokit.rest.pulls.list({
            owner,
            repo: repoName,
            state: "open",
            per_page: 50,
          });

          for (const pr of res.data) {
            // See if we already have it to avoid redundant imports if we don't want to re-run
            const existing = await ctx.prisma.pullRequest.findUnique({
              where: {
                repositoryId_number: { repositoryId: repo.id, number: pr.number },
              },
            });

            if (existing) continue;

            const refs = parseTaskRefs(pr.body);
            if (refs.length === 0) continue;

            // Map the first referenced task to its feature request
            const task = await ctx.prisma.task.findFirst({
              where: { ref: { in: refs } },
              select: { prd: { select: { featureRequestId: true } } },
            });
            if (!task?.prd) continue;

            const stored = await ctx.prisma.pullRequest.create({
              data: {
                number: pr.number,
                title: pr.title,
                url: pr.html_url,
                headSha: pr.head.sha,
                state: "OPEN",
                featureRequestId: task.prd.featureRequestId,
                repositoryId: repo.id,
              },
            });

            await ctx.prisma.featureRequest.update({
              where: { id: task.prd.featureRequestId },
              data: { status: "IN_PROGRESS" },
            });

            // Update task statuses
            await ctx.prisma.task.updateMany({
              where: { 
                ref: { in: refs },
                OR: [
                  { projectId: repo.projectId },
                  { prd: { featureRequest: { projectId: repo.projectId } } }
                ]
              },
              data: { status: "REVIEW" },
            });

            await inngest.send({
              name: EVENTS.REVIEW_RUN,
              data: { pullRequestId: stored.id },
            });

            syncedCount++;
          }
        } catch (err) {
          console.error(`Failed to sync PRs for ${repo.fullName}:`, err);
        }
      }

      return { syncedCount };
    }),
});
