import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Mail,
  MessageSquare,
  Ticket,
  Globe,
  Monitor,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function InboxPage(props: {
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

  // Find all features in DISCOVERY (raw ingest)
  const inbox = await prisma.featureRequest.findMany({
    where: {
      projectId: { in: projectIds },
      status: "DISCOVERY",
    },
    include: {
      project: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "SLACK":
        return <MessageSquare className="h-4 w-4" />;
      case "EMAIL":
        return <Mail className="h-4 w-4" />;
      case "TICKET":
        return <Ticket className="h-4 w-4" />;
      case "API":
        return <Globe className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Triage Inbox
          </h1>
          <p className="text-muted-foreground">
            Raw feature requests ingested from external channels like Slack,
            Email, and Support Tickets.
          </p>
        </div>

        {inbox.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/5 bg-[#101014]">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Inbox Zero
            </h3>
            <p className="text-[14px] text-muted-foreground">
              No new requests to triage.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {inbox.map((feature) => (
              <Link
                key={feature.id}
                href={`/dashboard/${workspaceId}/feature/${feature.id}`}
                className="block group"
              >
                <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-[#101014] hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-400">
                      {getSourceIcon(feature.source || "UI")}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-[15px] font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors truncate">
                        {feature.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[13px] text-muted-foreground mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-medium">
                          {feature.project.name}
                        </span>
                        <span className="flex items-center gap-1.5 uppercase text-[11px] font-bold tracking-wider">
                          {feature.source || "UI"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>
                          {formatDistanceToNow(feature.createdAt, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-[13.5px] text-muted-foreground line-clamp-1">
                        {feature.context}
                      </p>
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
