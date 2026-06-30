import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage(props: {
  params: Promise<{ workspaceId: string }>;
}) {
  const params = await props.params;
  const workspaceId = params.workspaceId;

  // Verify workspace exists
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { projects: true },
  });

  if (!workspace) return notFound();

  const projectIds = workspace.projects.map((p) => p.id);

  // Fetch features to plot on the calendar
  const features = await prisma.featureRequest.findMany({
    where: { projectId: { in: projectIds } },
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="flex-1 overflow-y-auto bg-black p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Activity Calendar
          </h1>
          <p className="text-muted-foreground">
            A heat map of when features were last updated or progressed through
            the pipeline.
          </p>
        </div>

        <CalendarClient features={features} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
