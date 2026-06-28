import crypto from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertWorkspaceMember } from "../lib/access";
import { logAudit } from "../lib/audit";

const RoleEnum = z.enum(["ADMIN", "LEAD", "MEMBER"]);
const INVITE_TTL_DAYS = 7;

/** Resolve the workspace for a member row and assert the caller's role. */
async function memberWorkspace(
  prisma: any,
  userId: string,
  memberId: string,
  roles?: string[]
) {
  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
    select: { id: true, workspaceId: true, role: true, userId: true },
  });
  if (!member) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
  }
  await assertWorkspaceMember(prisma, userId, member.workspaceId, roles);
  return member;
}

export const memberRouter = createTRPCRouter({
  /** Create (or refresh) an invitation. Returns the token for a shareable link. */
  invite: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        email: z.string().email().max(200),
        role: RoleEnum.default("MEMBER"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN", "LEAD"]
      );

      const email = input.email.trim().toLowerCase();

      // Already a member?
      const existing = await ctx.prisma.workspaceMember.findFirst({
        where: { workspaceId: input.workspaceId, user: { email } },
      });
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That person is already a member of this workspace.",
        });
      }

      const token = crypto.randomBytes(24).toString("hex");
      const expiresAt = new Date(
        Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
      );

      const invitation = await ctx.prisma.invitation.upsert({
        where: {
          workspaceId_email: { workspaceId: input.workspaceId, email },
        },
        update: {
          role: input.role,
          token,
          status: "PENDING",
          invitedById: ctx.session.user.id,
          expiresAt,
        },
        create: {
          workspaceId: input.workspaceId,
          email,
          role: input.role,
          token,
          invitedById: ctx.session.user.id,
          expiresAt,
        },
      });

      await logAudit({
        workspaceId: input.workspaceId,
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        action: "MEMBER_INVITED",
        target: `${email} (${input.role})`,
      });

      return { token: invitation.token, email };
    }),

  listInvitations: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId,
        ["ADMIN", "LEAD"]
      );
      return ctx.prisma.invitation.findMany({
        where: { workspaceId: input.workspaceId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });
    }),

  revokeInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.prisma.invitation.findUnique({
        where: { id: input.invitationId },
        select: { workspaceId: true },
      });
      if (!inv) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found." });
      }
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        inv.workspaceId,
        ["ADMIN", "LEAD"]
      );
      return ctx.prisma.invitation.update({
        where: { id: input.invitationId },
        data: { status: "REVOKED" },
      });
    }),

  /** Public-to-the-invitee details for the accept page. */
  getInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const inv = await ctx.prisma.invitation.findUnique({
        where: { token: input.token },
        include: { workspace: { select: { name: true } } },
      });
      if (!inv) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found." });
      }
      return {
        workspaceName: inv.workspace.name,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        expired: inv.expiresAt.getTime() < Date.now(),
        emailMatches:
          (ctx.session.user.email ?? "").toLowerCase() === inv.email,
      };
    }),

  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.prisma.invitation.findUnique({
        where: { token: input.token },
      });
      if (!inv || inv.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation is no longer valid.",
        });
      }
      if (inv.expiresAt.getTime() < Date.now()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has expired." });
      }
      if ((ctx.session.user.email ?? "").toLowerCase() !== inv.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `This invitation was sent to ${inv.email}. Sign in with that email to accept.`,
        });
      }

      await ctx.prisma.$transaction([
        ctx.prisma.workspaceMember.upsert({
          where: {
            userId_workspaceId: {
              userId: ctx.session.user.id,
              workspaceId: inv.workspaceId,
            },
          },
          update: { role: inv.role },
          create: {
            userId: ctx.session.user.id,
            workspaceId: inv.workspaceId,
            role: inv.role,
          },
        }),
        ctx.prisma.invitation.update({
          where: { id: inv.id },
          data: { status: "ACCEPTED" },
        }),
      ]);

      return { workspaceId: inv.workspaceId };
    }),

  updateRole: protectedProcedure
    .input(z.object({ memberId: z.string(), role: RoleEnum }))
    .mutation(async ({ ctx, input }) => {
      const member = await memberWorkspace(
        ctx.prisma,
        ctx.session.user.id,
        input.memberId,
        ["ADMIN"]
      );

      // Don't allow demoting the last remaining admin.
      if (member.role === "ADMIN" && input.role !== "ADMIN") {
        const admins = await ctx.prisma.workspaceMember.count({
          where: { workspaceId: member.workspaceId, role: "ADMIN" },
        });
        if (admins <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A workspace must keep at least one admin.",
          });
        }
      }

      const updated = await ctx.prisma.workspaceMember.update({
        where: { id: member.id },
        data: { role: input.role },
      });
      await logAudit({
        workspaceId: member.workspaceId,
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        action: "ROLE_CHANGED",
        target: `member ${member.userId} → ${input.role}`,
      });
      return updated;
    }),

  remove: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await memberWorkspace(
        ctx.prisma,
        ctx.session.user.id,
        input.memberId,
        ["ADMIN"]
      );

      if (member.role === "ADMIN") {
        const admins = await ctx.prisma.workspaceMember.count({
          where: { workspaceId: member.workspaceId, role: "ADMIN" },
        });
        if (admins <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You can't remove the last admin of a workspace.",
          });
        }
      }

      // Clear task assignments in this workspace
      await ctx.prisma.task.updateMany({
        where: {
          assigneeId: member.userId,
          OR: [
            { project: { workspaceId: member.workspaceId } },
            { prd: { featureRequest: { project: { workspaceId: member.workspaceId } } } }
          ]
        },
        data: { assigneeId: null }
      });

      const removed = await ctx.prisma.workspaceMember.delete({
        where: { id: member.id },
      });
      await logAudit({
        workspaceId: member.workspaceId,
        actorId: ctx.session.user.id,
        actorName: ctx.session.user.name,
        action: "MEMBER_REMOVED",
        target: `member ${member.userId}`,
      });
      return { success: true, isSelf: member.userId === ctx.session.user.id };
    }),
});
