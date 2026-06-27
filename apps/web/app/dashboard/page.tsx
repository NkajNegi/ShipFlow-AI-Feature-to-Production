import { redirect } from "next/navigation";
import { getTRPCServer } from "@/trpc/server";

export default async function DashboardRootPage() {
  const trpc = await getTRPCServer();
  const workspaces = await trpc.workspace.getUserWorkspaces();

  if (workspaces.length === 0) {
    redirect("/dashboard/onboarding");
  }

  // Redirect to the first workspace's dashboard home by default
  redirect(`/dashboard/${workspaces[0]!.id}`);
}
