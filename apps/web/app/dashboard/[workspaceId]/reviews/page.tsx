"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { SkeletonList } from "@/components/ui/skeleton";
import { QueryError } from "@/components/ui/query-error";

export default function ReviewHistoryPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const reviews = trpc.review.listForWorkspace.useQuery({ workspaceId });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Review History
        </h1>
        <p className="text-muted-foreground mt-1">
          Every AI code review run against pull requests in this workspace.
        </p>
      </div>

      {reviews.isError ? (
        <QueryError
          title="Couldn't load reviews"
          onRetry={() => reviews.refetch()}
          retrying={reviews.isFetching}
        />
      ) : reviews.isLoading ? (
        <SkeletonList rows={4} />
      ) : (reviews.data ?? []).length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-8 text-center text-muted-foreground">
            No AI reviews yet. They appear automatically when a pull request
            referencing a feature (e.g. <code>SF-123</code>) is opened.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(reviews.data ?? []).map((r) => {
            const blocked = r.blockingCount > 0;
            const pr = r.pullRequest;
            return (
              <Card key={r.id} className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {blocked ? (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    )}
                    <span
                      className={`text-xs rounded px-1.5 py-0.5 font-medium ${
                        blocked
                          ? "bg-red-500/15 text-red-400"
                          : "bg-emerald-500/15 text-emerald-400"
                      }`}
                    >
                      {r.status.replace(/_/g, " ").toLowerCase()}
                    </span>
                    {blocked && (
                      <span className="text-xs text-red-400">
                        {r.blockingCount} blocking
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">{r.summary}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {pr?.featureRequest && (
                      <Link
                        href={`/dashboard/${workspaceId}/feature/${pr.featureRequest.id}`}
                        className="text-primary hover:underline"
                      >
                        {pr.featureRequest.title}
                      </Link>
                    )}
                    {pr?.repository?.fullName && (
                      <span>
                        {pr.repository.fullName} · PR #{pr.number}
                      </span>
                    )}
                    {pr?.url && (
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        View PR <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
