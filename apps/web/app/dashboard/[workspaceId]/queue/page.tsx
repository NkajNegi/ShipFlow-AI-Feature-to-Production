import { prisma } from "@repo/db";
import { computeSlaState, formatSlaLabel } from "@repo/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SLA_PILL: Record<string, string> = {
  breached: "bg-red-500/15 text-red-400 border-red-500/30",
  due_soon: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export default async function QueuePage(props: {
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

  // Find all features awaiting human intervention
  const queue = await prisma.featureRequest.findMany({
    where: {
      projectId: { in: projectIds },
      status: { in: ["PLANNING", "IN_REVIEW"] },
    },
    include: {
      project: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="flex-1 overflow-y-auto bg-black p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Approval Queue
          </h1>
          <p className="text-muted-foreground">
            Features requiring human intervention before proceeding to the next
            stage.
          </p>
        </div>

        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/5 bg-[#101014]">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Inbox Zero
            </h3>
            <p className="text-[14px] text-muted-foreground">
              No features currently require human approval.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((feature) => (
              <Link
                key={feature.id}
                href={`/dashboard/${workspaceId}/feature/${feature.id}`}
                className="block group"
              >
                <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-[#101014] hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#c084fc]/10 flex items-center justify-center shrink-0">
                      {feature.status === "PLANNING" ? (
                        <CheckCircle className="h-5 w-5 text-[#c084fc]" />
                      ) : (
                        <ShieldCheck className="h-5 w-5 text-[#c084fc]" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-white mb-1 group-hover:text-[#c084fc] transition-colors">
                        {feature.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-medium">
                          {feature.project.name}
                        </span>
                        <span>
                          {feature.status === "PLANNING"
                            ? "Awaiting Plan Approval"
                            : "Awaiting Release Approval"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>
                          Updated{" "}
                          {formatDistanceToNow(feature.updatedAt, {
                            addSuffix: true,
                          })}
                        </span>
                        {(() => {
                          const sla = computeSlaState(
                            feature.reviewDueAt,
                            feature.status,
                            workspace.reviewSlaHours,
                          );
                          if (sla.state !== "breached" && sla.state !== "due_soon")
                            return null;
                          return (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${SLA_PILL[sla.state]}`}
                            >
                              {sla.state === "breached" && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {formatSlaLabel(sla)}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 pl-4">
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
