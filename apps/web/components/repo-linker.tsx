"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function RepoLinker({ 
  workspaceId, 
  onSuccess 
}: { 
  workspaceId: string; 
  onSuccess?: () => void; 
}) {
  const utils = trpc.useUtils();
  const available = trpc.github.listRepositories.useQuery(
    { workspaceId },
    { retry: false }
  );
  const projects = trpc.project.list.useQuery({ workspaceId });
  const [repoSel, setRepoSel] = useState("");
  const [projSel, setProjSel] = useState("");

  const link = trpc.github.linkRepository.useMutation({
    onSuccess: () => {
      setRepoSel("");
      utils.billing.getStatus.invalidate({ workspaceId });
      utils.github.listLinkedRepositories.invalidate({ workspaceId });
      onSuccess?.();
    },
  });

  const connect = () => {
    const r = available.data?.find((x) => String(x.githubId) === repoSel);
    if (r && projSel) {
      link.mutate({
        projectId: projSel,
        githubId: r.githubId,
        name: r.name,
        fullName: r.fullName,
        url: r.url,
      });
    }
  };

  if (available.isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Connect GitHub first, then link repositories to a project here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={repoSel}
          onChange={(e) => setRepoSel(e.target.value)}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">
            {available.isLoading ? "Loading repos…" : "Select a repository"}
          </option>
          {(available.data ?? []).map((r: any) => (
            <option key={r.githubId} value={String(r.githubId)}>
              {r.fullName}
              {r.private ? " (private)" : ""}
            </option>
          ))}
        </select>
        <select
          value={projSel}
          onChange={(e) => setProjSel(e.target.value)}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">
            {projects.isLoading ? "Loading projects…" : "Select a project"}
          </option>
          {(projects.data ?? []).map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={!repoSel || !projSel || link.isPending}
          onClick={connect}
        >
          {link.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Connect
        </Button>
      </div>
      {link.error && (
        <p className="text-sm text-red-400">{link.error.message}</p>
      )}
    </div>
  );
}
