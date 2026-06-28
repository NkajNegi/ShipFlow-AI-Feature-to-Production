import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@repo/api";
import { getInstallationOctokit } from "@repo/api";
import { headers } from "next/headers";

export const runtime = "nodejs";

/**
 * GitHub App installation callback.
 *
 * After the user installs the MetroFlow GitHub App, GitHub redirects here with
 * `installation_id` and the `state` we passed (the workspaceId). We persist the
 * installation on the workspace so Octokit can act on its behalf.
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const installationId = Number(searchParams.get("installation_id"));
  const workspaceId = searchParams.get("state");

  if (!installationId || !workspaceId) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Verify the requester is an ADMIN/LEAD of the target workspace.
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member || !["ADMIN", "LEAD"].includes(member.role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Best-effort lookup of the installation account login for display.
  let accountLogin: string | null = null;
  try {
    const octokit = getInstallationOctokit(installationId);
    const { data } = await octokit.rest.apps.getInstallation({
      installation_id: installationId,
    });
    accountLogin =
      (data.account && "login" in data.account ? data.account.login : null) ??
      null;
  } catch {
    // ignore; we still store the installation id
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      githubInstallationId: installationId,
      githubAccountLogin: accountLogin,
    },
  });

  return NextResponse.redirect(
    new URL(`/dashboard/${workspaceId}/settings`, req.url)
  );
}
