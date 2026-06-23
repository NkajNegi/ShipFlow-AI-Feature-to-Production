import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { inngest, EVENTS } from "@repo/inngest";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  assertWorkspaceMember,
  assertProjectAccess,
} from "../lib/access";
import { getInstallationOctokit, getInstallUrl } from "../lib/github";
import { enforceRateLimit } from "../lib/ratelimit";

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
        projectId: z.string(),
        githubId: z.number(),
        name: z.string(),
        fullName: z.string(),
        url: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectAccess(
        ctx.prisma,
        ctx.session.user.id,
        input.projectId,
        ["ADMIN", "LEAD"]
      );
      return ctx.prisma.repository.upsert({
        where: { githubId: input.githubId },
        update: {
          name: input.name,
          fullName: input.fullName,
          url: input.url,
          projectId: input.projectId,
        },
        create: {
          githubId: input.githubId,
          name: input.name,
          fullName: input.fullName,
          url: input.url,
          projectId: input.projectId,
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
});
