import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@repo/db";

type Db = PrismaClient;

/**
 * Enforce that a user belongs to a workspace, optionally with one of the given
 * roles. This is the core of ShipFlow's multi-tenant data isolation. Every
 * router that reads or writes workspace-scoped data must call this.
 */
export async function assertWorkspaceMember(
  prisma: Db,
  userId: string,
  workspaceId: string,
  roles?: string[]
) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!member) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this workspace.",
    });
  }

  if (roles && !roles.includes(member.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This action requires one of: ${roles.join(", ")}.`,
    });
  }

  return member;
}

/** Resolve the owning workspace id for a project and assert membership. */
export async function assertProjectAccess(
  prisma: Db,
  userId: string,
  projectId: string,
  roles?: string[]
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true },
  });
  if (!project) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
  }
  await assertWorkspaceMember(prisma, userId, project.workspaceId, roles);
  return project;
}

/** Resolve the owning workspace for a feature request and assert membership. */
export async function assertFeatureRequestAccess(
  prisma: Db,
  userId: string,
  featureRequestId: string,
  roles?: string[]
) {
  const fr = await prisma.featureRequest.findUnique({
    where: { id: featureRequestId },
    select: { id: true, project: { select: { workspaceId: true } } },
  });
  if (!fr) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Feature request not found.",
    });
  }
  await assertWorkspaceMember(prisma, userId, fr.project.workspaceId, roles);
  return fr;
}
