"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Rocket,
  Gauge,
  Bug,
  ShieldCheck,
  FolderKanban,
  LayoutList,
  GitCommit,
  ArrowRight,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  DISCOVERY: "bg-sky-500/15 text-sky-400",
  GENERATING_PRD: "bg-violet-500/15 text-violet-400",
  PLANNING: "bg-indigo-500/15 text-indigo-400",
  IN_PROGRESS: "bg-amber-500/15 text-amber-400",
  IN_REVIEW: "bg-cyan-500/15 text-cyan-400",
  FIX_NEEDED: "bg-red-500/15 text-red-400",
  APPROVED: "bg-emerald-500/15 text-emerald-400",
  SHIPPED: "bg-emerald-600/20 text-emerald-300",
  REJECTED: "bg-zinc-500/15 text-zinc-400",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`text-xs rounded px-1.5 py-0.5 font-medium ${cls}`}>
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export default function WorkspaceDashboard({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const metrics = trpc.review.getWorkspaceMetrics.useQuery({ workspaceId });
  const features = trpc.featureRequest.listByWorkspace.useQuery({ workspaceId });

  const counts = (features.data ?? []).reduce<Record<string, number>>(
    (acc, f) => {
      acc[f.status] = (acc[f.status] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const active = (features.data ?? []).filter(
    (f) => f.status !== "SHIPPED" && f.status !== "REJECTED"
  ).length;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Your team’s delivery pipeline at a glance.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric
          icon={<Rocket className="h-5 w-5 text-primary" />}
          label="Shipped"
          value={metrics.data?.shippedCount}
          loading={metrics.isLoading}
        />
        <Metric
          icon={<Gauge className="h-5 w-5 text-primary" />}
          label="Avg cycle (hrs)"
          value={metrics.data?.avgCycleHours}
          loading={metrics.isLoading}
        />
        <Metric
          icon={<Bug className="h-5 w-5 text-primary" />}
          label="Issues caught"
          value={metrics.data?.bugsCaught}
          loading={metrics.isLoading}
        />
        <Metric
          icon={<ShieldCheck className="h-5 w-5 text-primary" />}
          label="Blocking caught"
          value={metrics.data?.blockingCaught}
          loading={metrics.isLoading}
        />
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-3">
        <QuickLink
          href={`/dashboard/${workspaceId}/projects`}
          icon={<FolderKanban className="h-5 w-5 text-primary" />}
          title="Projects"
          desc="Create features & PRDs"
        />
        <QuickLink
          href={`/dashboard/${workspaceId}/board`}
          icon={<LayoutList className="h-5 w-5 text-primary" />}
          title="Kanban Board"
          desc="Track engineering tasks"
        />
        <QuickLink
          href={`/dashboard/${workspaceId}/commits`}
          icon={<GitCommit className="h-5 w-5 text-primary" />}
          title="Commit Review"
          desc="AI review of commits"
        />
      </div>

      {/* Pipeline */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Pipeline</CardTitle>
          <CardDescription>
            {active} active · {counts["SHIPPED"] ?? 0} shipped ·{" "}
            {counts["REJECTED"] ?? 0} rejected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.keys(STATUS_STYLES).map((s) =>
              counts[s] ? (
                <span key={s} className="flex items-center gap-1">
                  <StatusBadge status={s} />
                  <span className="text-xs text-muted-foreground">
                    {counts[s]}
                  </span>
                </span>
              ) : null
            )}
            {Object.keys(counts).length === 0 && (
              <p className="text-sm text-muted-foreground">
                No feature requests yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent features */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Recent feature requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {features.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (features.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing yet — create one from{" "}
              <Link
                href={`/dashboard/${workspaceId}/projects`}
                className="text-primary hover:underline"
              >
                Projects
              </Link>
              .
            </p>
          ) : (
            (features.data ?? []).slice(0, 8).map((f) => (
              <Link
                key={f.id}
                href={`/dashboard/${workspaceId}/feature/${f.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {f.project.name}
                    {f._count.pullRequests > 0
                      ? ` · ${f._count.pullRequests} PR${f._count.pullRequests > 1 ? "s" : ""}`
                      : ""}
                    {` · ${f.source.toLowerCase()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={f.status} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">{icon}</div>
        <p className="text-2xl font-bold text-primary mt-2">
          {loading ? "—" : (value ?? 0)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border p-4 hover:border-primary/40 transition-colors block"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}
