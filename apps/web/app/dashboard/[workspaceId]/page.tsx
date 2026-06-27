"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { SetupChecklist } from "@/components/setup-checklist";
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
  FolderKanban,
  LayoutList,
  GitCommit,
  ArrowRight,
  Users,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Clock,
  CalendarDays,
  Activity,
  ListTodo
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
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ setup?: string }>;
}) {
  const { workspaceId } = use(params);
  const { setup } = use(searchParams);
  const isWizard = setup === "true";
  
  const metrics = trpc.review.getWorkspaceMetrics.useQuery({ workspaceId });
  const features = trpc.featureRequest.listByWorkspace.useQuery({ workspaceId });
  const taskMetrics = trpc.task.getDashboardMetrics.useQuery({ workspaceId });
  const comments = trpc.comment.getRecent.useQuery({ workspaceId });

  // Math for the distribution bar
  const tCounts = taskMetrics.data?.statusCounts || {};
  const tTotal = taskMetrics.data?.totalTasks || 1; // avoid /0
  const pTodo = ((tCounts["TODO"] || 0) / tTotal) * 100;
  const pProg = ((tCounts["IN_PROGRESS"] || 0) / tTotal) * 100;
  const pRev = ((tCounts["REVIEW"] || 0) / tTotal) * 100;
  const pDone = ((tCounts["DONE"] || 0) / tTotal) * 100;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <SetupChecklist workspaceId={workspaceId} mode={isWizard ? "wizard" : "dashboard"} />
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your team’s command center.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric 
          icon={<Rocket className="h-5 w-5 text-emerald-500" />} 
          label="Features Shipped" 
          value={metrics.data?.shippedCount} 
          loading={metrics.isLoading} 
        />
        <Metric 
          icon={<ListTodo className="h-5 w-5 text-indigo-500" />} 
          label="My Open Tasks" 
          value={taskMetrics.data?.myTasks.length} 
          loading={taskMetrics.isLoading} 
        />
        <Metric 
          icon={<AlertTriangle className={`h-5 w-5 ${taskMetrics.data?.overdueTasks?.length ? 'text-red-500' : 'text-muted-foreground'}`} />} 
          label="Overdue (Workspace)" 
          value={taskMetrics.data?.overdueTasks?.length} 
          loading={taskMetrics.isLoading} 
          alert={!!taskMetrics.data?.overdueTasks?.length}
        />
        <Metric 
          icon={<Gauge className="h-5 w-5 text-sky-500" />} 
          label="Avg cycle (hrs)" 
          value={metrics.data?.avgCycleHours} 
          loading={metrics.isLoading} 
        />
      </div>

      {/* Task Distribution Bar */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Workspace Task Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-4 w-full rounded-full overflow-hidden bg-muted">
            {pTodo > 0 && <div style={{ width: `${pTodo}%` }} className="bg-slate-300 dark:bg-slate-700 transition-all" title={`TODO: ${tCounts["TODO"]}`} />}
            {pProg > 0 && <div style={{ width: `${pProg}%` }} className="bg-amber-500 transition-all" title={`IN PROGRESS: ${tCounts["IN_PROGRESS"]}`} />}
            {pRev > 0 && <div style={{ width: `${pRev}%` }} className="bg-cyan-500 transition-all" title={`REVIEW: ${tCounts["REVIEW"]}`} />}
            {pDone > 0 && <div style={{ width: `${pDone}%` }} className="bg-emerald-500 transition-all" title={`DONE: ${tCounts["DONE"]}`} />}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-xs text-muted-foreground mt-3">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"/>TODO ({tCounts["TODO"] || 0})</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"/>IN PROGRESS ({tCounts["IN_PROGRESS"] || 0})</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-500"/>REVIEW ({tCounts["REVIEW"] || 0})</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"/>DONE ({tCounts["DONE"] || 0})</div>
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        <QuickLink
          href={`/dashboard/${workspaceId}/settings`}
          icon={<Users className="h-5 w-5 text-primary" />}
          title="Team & Members"
          desc="Invite your team"
        />
      </div>

      {/* 2-Column Split for Action / Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Actionable */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> My Active Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {taskMetrics.isLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : 
               taskMetrics.data?.myTasks.length === 0 ? <p className="text-sm text-muted-foreground">You have no assigned tasks. Grab some coffee! ☕</p> :
               taskMetrics.data?.myTasks.map((t: any) => (
                 <Link key={t.id} href={`/dashboard/${workspaceId}/board`} className="flex flex-col p-3 rounded-lg border hover:border-primary/50 transition-colors">
                   <div className="flex justify-between items-start">
                     <span className="text-sm font-medium">{t.title}</span>
                     <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{t.status.replace("_", " ")}</span>
                   </div>
                   <span className="text-xs text-muted-foreground mt-1">{t.project?.name || t.prd?.featureRequest?.title || "No Project"}</span>
                 </Link>
               ))}
            </CardContent>
          </Card>

          {taskMetrics.data?.overdueTasks && taskMetrics.data.overdueTasks.length > 0 && (
            <Card className="border-red-500/50 bg-red-500/5 dark:bg-red-500/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" /> Overdue Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {taskMetrics.data.overdueTasks.map((t: any) => (
                  <Link key={t.id} href={`/dashboard/${workspaceId}/board`} className="flex flex-col p-3 rounded-lg border border-red-500/20 bg-background hover:border-red-500/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium">{t.title}</span>
                      <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                        <CalendarDays className="h-3 w-3" />
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {t.assignee?.image ? (
                        <img src={t.assignee.image} className="h-4 w-4 rounded-full" />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[8px]">{t.assignee?.name?.charAt(0) || '?'}</div>
                      )}
                      <span className="text-xs text-muted-foreground">{t.assignee?.name || "Unassigned"}</span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Feed & Features */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.isLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : 
               comments.data?.length === 0 ? <p className="text-sm text-muted-foreground">No recent activity.</p> :
               comments.data?.map((c: any) => (
                 <div key={c.id} className="flex gap-3 items-start">
                   {c.author.image ? (
                     <img src={c.author.image} className="h-8 w-8 rounded-full shrink-0 mt-0.5" />
                   ) : (
                     <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-medium mt-0.5 text-xs">
                       {c.author.name?.charAt(0) || '?'}
                     </div>
                   )}
                   <div className="min-w-0 flex-1">
                     <p className="text-sm">
                       <span className="font-medium">{c.author.name}</span> commented on 
                       <Link href={`/dashboard/${workspaceId}/board`} className="text-primary hover:underline ml-1 font-medium">
                         {c.task.title}
                       </Link>
                     </p>
                     <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 bg-muted/50 p-2 rounded-md border">{c.content}</p>
                     <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1.5">
                       <Clock className="h-3 w-3" /> {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </p>
                   </div>
                 </div>
               ))}
            </CardContent>
          </Card>

          {/* Recent Features */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Recent feature requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {features.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
                (features.data ?? []).slice(0, 5).map((f: any) => (
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

      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  loading,
  alert
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  loading: boolean;
  alert?: boolean;
}) {
  return (
    <Card className={`border-border ${alert ? 'border-red-500/50 bg-red-500/5 dark:bg-red-500/10' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">{icon}</div>
        <p className={`text-2xl font-bold mt-2 ${alert ? 'text-red-500' : 'text-primary'}`}>
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
