import { redirect } from "next/navigation";
import { auth } from "@repo/api";
import { headers } from "next/headers";
import { AgentClient } from "./AgentClient";

export const metadata = {
  title: "AI Copilot | MetroFlow AI",
};

export default async function AgentPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col h-full">
      <AgentClient workspaceId={workspaceId} />
    </div>
  );
}
