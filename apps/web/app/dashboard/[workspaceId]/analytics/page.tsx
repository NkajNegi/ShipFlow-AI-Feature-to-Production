import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage(props: {
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

  // For this demo, we'll aggregate all features across all projects in the workspace.
  const projectIds = workspace.projects.map((p) => p.id);

  const features = await prisma.featureRequest.findMany({
    where: { projectId: { in: projectIds } },
    select: {
      id: true,
      title: true,
      status: true,
      source: true,
      createdAt: true,
      updatedAt: true,
      pullRequests: {
        select: {
          reviews: {
            select: { status: true, blockingCount: true },
          },
        },
      },
    },
  });

  // Calculate funnel metrics
  const statuses = [
    "DISCOVERY",
    "GENERATING_PRD",
    "PLANNING",
    "PLAN_APPROVED",
    "DUPLICATE_EDUCATION",
    "IN_PROGRESS",
    "IN_REVIEW",
    "FIX_NEEDED",
    "APPROVED",
    "SHIPPED",
    "REJECTED",
  ];

  const statusCounts = features.reduce(
    (acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const funnelData = statuses.map((status) => ({
    name: status.replace("_", " "),
    count: statusCounts[status] || 0,
  }));

  // Calculate throughput summary
  let shipped = 0;
  let rejected = 0;
  let inFlight = 0;

  features.forEach((f) => {
    if (f.status === "SHIPPED") shipped++;
    else if (f.status === "REJECTED") rejected++;
    else inFlight++;
  });

  const throughputData = [
    { name: "Shipped", value: shipped, color: "#10b981" },
    { name: "Rejected", value: rejected, color: "#ef4444" },
    { name: "In Flight", value: inFlight, color: "#c084fc" },
  ];

  // Calculate AI review stats
  let totalReviews = 0;
  let blockingReviews = 0;
  let passingReviews = 0;

  features.forEach((f) => {
    f.pullRequests.forEach((pr) => {
      pr.reviews.forEach((r) => {
        totalReviews++;
        if (r.blockingCount > 0 || r.status === "CHANGES_REQUESTED") {
          blockingReviews++;
        } else {
          passingReviews++;
        }
      });
    });
  });

  return (
    <div className="flex-1 overflow-y-auto bg-black p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Feature throughput, cycle time, and AI review efficacy.
          </p>
        </div>

        <AnalyticsClient
          funnelData={funnelData}
          throughputData={throughputData}
          stats={{
            totalFeatures: features.length,
            totalReviews,
            blockingReviews,
            passingReviews,
          }}
        />
      </div>
    </div>
  );
}
