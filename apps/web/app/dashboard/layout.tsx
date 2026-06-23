import { ReactNode } from "react";
import { auth } from "@repo/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getTRPCServer } from "@/trpc/server";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const trpc = await getTRPCServer();
  const workspaces = await trpc.workspace.getUserWorkspaces();

  return (
    <DashboardShell
      workspaces={workspaces.map((w) => ({ id: w.id, name: w.name }))}
    >
      {children}
    </DashboardShell>
  );
}
