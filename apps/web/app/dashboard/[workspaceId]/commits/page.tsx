"use client";

import { use, useMemo, useState, useEffect, useRef } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";
import { QueryError } from "@/components/ui/query-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  GitCommit,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

type Finding = {
  type: "FLAW" | "IMPROVEMENT";
  severity: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  title: string;
  detail: string;
  file?: string;
  suggestion?: string;
};

export default function CommitsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const repos = trpc.github.listLinkedRepositories.useQuery({ workspaceId });
  const [repositoryId, setRepositoryId] = useState<string | null>(null);

  // Default to the first linked repo once loaded.
  const activeRepoId = repositoryId ?? repos.data?.[0]?.id ?? null;

  const syncPRs = trpc.github.syncPullRequests.useMutation({
    onSuccess: (data) => {
      alert(
        `Successfully synced ${data.syncedCount} pull requests from GitHub! Check your Kanban board.`,
      );
    },
    onError: (err) => {
      alert(`Failed to sync PRs: ${err.message}`);
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Commit Review
          </h1>
          <p className="text-muted-foreground mt-1">
            Run an AI review over a commit’s diff to surface flaws and
            improvements. Runs on Claude Opus.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={syncPRs.isPending}
          onClick={() => syncPRs.mutate({ workspaceId })}
          className="shrink-0"
        >
          {syncPRs.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Sync GitHub PRs
        </Button>
      </div>

      {repos.isError ? (
        <QueryError
          title="Couldn't load repositories"
          onRetry={() => repos.refetch()}
          retrying={repos.isFetching}
        />
      ) : repos.isLoading ? (
        <SkeletonList rows={3} />
      ) : !repos.data || repos.data.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-8 text-center text-muted-foreground">
            No repositories linked yet. Connect GitHub and link a repo to a
            project in <span className="text-primary">Settings</span> first.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm text-muted-foreground">Repository</label>
            <select
              value={activeRepoId ?? ""}
              onChange={(e) => setRepositoryId(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {repos.data.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName ?? r.name}
                </option>
              ))}
            </select>
          </div>

          {activeRepoId && <RepoCommits repositoryId={activeRepoId} />}
        </>
      )}
    </div>
  );
}

function RepoCommits({ repositoryId }: { repositoryId: string }) {
  const utils = trpc.useUtils();
  const commits = trpc.commit.listCommits.useQuery(
    { repositoryId },
    { retry: false },
  );
  const reviews = trpc.commit.listReviews.useQuery({ repositoryId });
  const [activeSha, setActiveSha] = useState<string | null>(null);

  const review = trpc.commit.reviewCommit.useMutation({
    onSuccess: (data) => {
      setActiveSha(data.sha);
      utils.commit.listReviews.invalidate({ repositoryId });
    },
  });

  // Map sha -> stored review status for inline badges.
  const reviewBySha = useMemo(() => {
    const m: Record<string, { status: string }> = {};
    for (const r of reviews.data ?? []) m[r.sha] = { status: r.status };
    return m;
  }, [reviews.data]);

  const hasAutoReviewed = useRef(false);

  // Reset auto-review flag when repository changes
  useEffect(() => {
    hasAutoReviewed.current = false;
  }, [repositoryId]);

  // Automatically review or select the latest commit
  useEffect(() => {
    if (commits.data && commits.data.length > 0 && !hasAutoReviewed.current) {
      const latestSha = commits.data[0]?.sha;
      if (!latestSha) return;
      const latestStored = reviewBySha[latestSha];

      // If we haven't reviewed the latest commit, automatically review it
      if (!latestStored) {
        hasAutoReviewed.current = true;
        review.mutate({ repositoryId, sha: latestSha });
      } else if (!activeSha) {
        // If it's already reviewed, just auto-select it to show the panel
        hasAutoReviewed.current = true;
        setActiveSha(latestSha);
      }
    }
  }, [commits.data, reviewBySha, activeSha, repositoryId, review]);

  if (commits.isLoading) {
    return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  }
  if (commits.error) {
    return (
      <Card className="border-border">
        <CardContent className="py-6 text-sm text-red-400">
          {commits.error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={review.isPending}
          onClick={() => review.mutate({ repositoryId })}
        >
          {review.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Review latest commit
        </Button>
      </div>

      {activeSha && <ReviewPanel repositoryId={repositoryId} sha={activeSha} />}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitCommit className="h-5 w-5 text-primary" /> Recent commits
          </CardTitle>
          <CardDescription>
            Pick a commit to review its diff for flaws and improvements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(commits.data ?? []).map((c) => {
            const stored = reviewBySha[c.sha];
            return (
              <div
                key={c.sha}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {c.message.split("\n")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <code className="text-primary">{c.sha.slice(0, 7)}</code>
                    {c.authorName ? ` · ${c.authorName}` : ""}
                    {c.date
                      ? ` · ${new Date(c.date).toLocaleDateString()}`
                      : ""}
                    {stored ? ` · review: ${stored.status.toLowerCase()}` : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ repositoryId, sha: c.sha })}
                >
                  Review
                </Button>
              </div>
            );
          })}
          {review.error && (
            <p className="text-sm text-red-400">{review.error.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewPanel({
  repositoryId,
  sha,
}: {
  repositoryId: string;
  sha: string;
}) {
  const q = trpc.commit.getReview.useQuery(
    { repositoryId, sha },
    {
      // Poll until the async review completes or fails.
      // React Query v4: the callback receives `data` as the first argument.
      refetchInterval: (data: any) => {
        const status = data?.status;
        return status === "COMPLETED" || status === "FAILED" ? false : 2000;
      },
    },
  );

  const data = q.data;
  const findings = (data?.findingsJson as Finding[] | undefined) ?? [];
  const flaws = findings.filter((f) => f.type === "FLAW");
  const improvements = findings.filter((f) => f.type === "IMPROVEMENT");

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" /> AI review ·{" "}
          <code className="text-primary text-sm">{sha.slice(0, 7)}</code>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data || data.status === "PENDING" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Reviewing the commit diff…
          </div>
        ) : data.status === "FAILED" ? (
          <p className="text-sm text-red-400">
            Review failed: {data.error ?? "Unknown error"}
          </p>
        ) : (
          <>
            <p className="text-sm">{data.summary}</p>

            {findings.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> No issues found.
              </div>
            ) : (
              <div className="space-y-4">
                <FindingGroup
                  title="Flaws"
                  icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
                  findings={flaws}
                />
                <FindingGroup
                  title="Improvements"
                  icon={<Lightbulb className="h-4 w-4 text-amber-400" />}
                  findings={improvements}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FindingGroup({
  title,
  icon,
  findings,
}: {
  title: string;
  icon: React.ReactNode;
  findings: Finding[];
}) {
  if (findings.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon} {title} ({findings.length})
      </div>
      {findings.map((f, i) => (
        <div key={i} className="rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
              {f.severity}
            </span>
            <span className="text-xs rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
              {f.category}
            </span>
            <span className="text-sm font-medium">{f.title}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{f.detail}</p>
          {f.file && (
            <p className="text-xs text-muted-foreground mt-1">
              <code className="text-primary">{f.file}</code>
            </p>
          )}
          {f.suggestion && (
            <p className="text-sm mt-1">
              <span className="text-primary">Suggestion:</span> {f.suggestion}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
