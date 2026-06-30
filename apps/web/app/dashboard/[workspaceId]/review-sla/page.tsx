"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonList } from "@/components/ui/skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Clock, AlertTriangle, CheckCircle2, Timer } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function slaPill(state: string, hoursRemaining: number | null) {
  if (state === "closed" || hoursRemaining === null) return null;
  const h = Math.abs(hoursRemaining);
  const label =
    h >= 48 ? `${Math.round(h / 24)}d` : h >= 1 ? `${Math.round(h)}h` : "<1h";
  const map: Record<string, string> = {
    breached: "bg-red-500/15 text-red-400 border-red-500/30",
    due_soon: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    on_track: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  const text =
    state === "breached" ? `overdue ${label}` : `due in ${label}`;
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${map[state] ?? ""}`}
    >
      {text}
    </span>
  );
}

export default function ReviewSlaPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const board = trpc.review.slaBoard.useQuery(
    { workspaceId },
    { refetchInterval: 60_000 },
  );

  const counts = board.data?.counts;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Review SLA
        </h1>
        <p className="text-muted-foreground mt-1">
          Features awaiting review or approval, tracked against a{" "}
          {board.data?.slaHours ?? 24}h SLA. Breaches need attention.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "onTrack", label: "On track", icon: CheckCircle2, cls: "text-emerald-400" },
          { key: "dueSoon", label: "Due soon", icon: Timer, cls: "text-amber-400" },
          { key: "breached", label: "Breached", icon: AlertTriangle, cls: "text-red-400" },
        ].map((c) => (
          <Card key={c.key} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <c.icon className={`h-5 w-5 ${c.cls}`} />
              <div>
                <div className="text-2xl font-bold">
                  {counts ? (counts as any)[c.key] : "—"}
                </div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {board.isError ? (
        <QueryError
          title="Couldn't load the SLA board"
          onRetry={() => board.refetch()}
          retrying={board.isFetching}
        />
      ) : board.isLoading ? (
        <SkeletonList rows={4} />
      ) : (board.data?.items ?? []).length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-8 text-center text-muted-foreground">
            Nothing in review right now. Features appear here once they reach AI
            review or human approval.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {board.data!.items.map((f) => (
            <Link
              key={f.id}
              href={`/dashboard/${workspaceId}/feature/${f.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 hover:bg-white/[0.03] transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{f.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>{f.project.name}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {f.reviewStartedAt
                      ? `in review ${formatDistanceToNow(new Date(f.reviewStartedAt))}`
                      : f.status}
                  </span>
                </p>
              </div>
              {slaPill(f.sla.state, f.sla.hoursRemaining)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
