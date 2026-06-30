"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonList } from "@/components/ui/skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Rocket, GitPullRequest } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ShippedPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const all = trpc.featureRequest.listByWorkspace.useQuery({ workspaceId });

  const shipped = (all.data ?? [])
    .filter((f) => f.status === "SHIPPED")
    .sort(
      (a, b) =>
        new Date(b.shippedAt ?? b.createdAt).getTime() -
        new Date(a.shippedAt ?? a.createdAt).getTime(),
    );

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = shipped.filter(
    (f) => new Date(f.shippedAt ?? f.createdAt).getTime() >= weekAgo,
  ).length;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Shipped
          </h1>
          <p className="text-muted-foreground mt-1">
            Features that made it all the way to production.
          </p>
        </div>
        {!all.isLoading && !all.isError && (
          <div className="text-right">
            <div className="text-2xl font-bold">{shipped.length}</div>
            <div className="text-xs text-muted-foreground">
              shipped · {thisWeek} this week
            </div>
          </div>
        )}
      </div>

      {all.isError ? (
        <QueryError
          title="Couldn't load shipped features"
          onRetry={() => all.refetch()}
          retrying={all.isFetching}
        />
      ) : all.isLoading ? (
        <SkeletonList rows={4} />
      ) : shipped.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-8 text-center text-muted-foreground">
            Nothing shipped yet. Approved features appear here once marked
            shipped.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {shipped.map((f) => (
            <Link
              key={f.id}
              href={`/dashboard/${workspaceId}/feature/${f.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Rocket className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {f.project.name}
                    {f.shippedAt
                      ? ` · shipped ${formatDistanceToNow(new Date(f.shippedAt), { addSuffix: true })}`
                      : ""}
                  </p>
                </div>
              </div>
              {f._count.pullRequests > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <GitPullRequest className="h-3.5 w-3.5" />
                  {f._count.pullRequests}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
