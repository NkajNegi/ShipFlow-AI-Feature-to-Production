"use client";

import { use } from "react";
import { trpc } from "@/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonList } from "@/components/ui/skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Bot, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ActivityPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const feed = trpc.workspace.getActivityFeed.useQuery(
    { workspaceId, limit: 60 },
    { refetchInterval: 30_000 },
  );

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Activity
        </h1>
        <p className="text-muted-foreground mt-1">
          Everything happening across the workspace — human decisions and AI
          operations.
        </p>
      </div>

      {feed.isError ? (
        <QueryError
          title="Couldn't load activity"
          onRetry={() => feed.refetch()}
          retrying={feed.isFetching}
        />
      ) : feed.isLoading ? (
        <SkeletonList rows={6} />
      ) : (feed.data?.items ?? []).length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-8 text-center text-muted-foreground">
            No activity yet. Actions like approvals, PRD generation, and AI
            reviews will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {feed.data!.items.map((it) => (
            <div
              key={it.id}
              className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-white/[0.03] transition-colors"
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  it.kind === "ai"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {it.kind === "ai" ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{it.actor}</span>{" "}
                  <span className="text-muted-foreground">{it.summary}</span>
                  {it.target ? (
                    <span className="text-foreground"> · {it.target}</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(it.at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
