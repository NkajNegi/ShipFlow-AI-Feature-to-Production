"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  FolderPlus,
  GitBranch,
  CheckCircle2,
  Circle,
} from "lucide-react";

/**
 * Workspace setup steps — the core path to a working pipeline:
 *   1. Connect GitHub (install the App)  2. Create a project  3. Link a repo
 *
 * Rendered two ways from one source of truth:
 *   - variant="wizard"    → full setup page shown right after onboarding
 *   - variant="checklist" → compact card on the dashboard; hides when complete
 */
export function WorkspaceSetup({
  workspaceId,
  variant,
}: {
  workspaceId: string;
  variant: "wizard" | "checklist";
}) {
  const utils = trpc.useUtils();
  const status = trpc.github.getStatus.useQuery({ workspaceId });
  const projects = trpc.project.list.useQuery({ workspaceId });
  const linked = trpc.github.listLinkedRepositories.useQuery({ workspaceId });

  const loading =
    status.isLoading || projects.isLoading || linked.isLoading;
  const ghConnected = Boolean(status.data?.connected);
  const hasProject = (projects.data?.length ?? 0) > 0;
  const hasRepo = (linked.data?.length ?? 0) > 0;
  const allDone = ghConnected && hasProject && hasRepo;

  // --- actions ---
  const [connecting, setConnecting] = useState(false);
  const connectGitHub = async () => {
    setConnecting(true);
    try {
      const { url } = await utils.github.getInstallUrl.fetch({ workspaceId });
      window.location.href = url;
    } catch {
      setConnecting(false);
    }
  };

  const [projName, setProjName] = useState("");
  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      setProjName("");
      projects.refetch();
    },
  });

  const available = trpc.github.listRepositories.useQuery(
    { workspaceId },
    { retry: false, enabled: ghConnected }
  );
  const [repoSel, setRepoSel] = useState("");
  const [projSel, setProjSel] = useState("");
  const link = trpc.github.linkRepository.useMutation({
    onSuccess: () => {
      setRepoSel("");
      linked.refetch();
      utils.billing.getStatus.invalidate({ workspaceId });
    },
  });
  const connectRepo = () => {
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

  // Checklist disappears once everything is set up (or while first loading).
  if (variant === "checklist" && (loading || allDone)) return null;

  const doneCount = [ghConnected, hasProject, hasRepo].filter(Boolean).length;

  const body = (
    <div className="space-y-3">
      {/* Step 1 — GitHub */}
      <Step done={ghConnected} icon={GitBranch} title="Connect GitHub" loading={loading}>
        {ghConnected ? (
          <p className="text-sm text-emerald-400">
            Connected{status.data?.accountLogin ? ` · ${status.data.accountLogin}` : ""}.
          </p>
        ) : (
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={connecting}
            onClick={connectGitHub}
          >
            {connecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GitBranch className="mr-2 h-4 w-4" />
            )}
            Install the GitHub App
          </Button>
        )}
      </Step>

      {/* Step 2 — Project */}
      <Step done={hasProject} icon={FolderPlus} title="Create a project" loading={loading}>
        {hasProject ? (
          <p className="text-sm text-emerald-400">
            {projects.data!.length} project
            {projects.data!.length > 1 ? "s" : ""} created.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Project name (e.g. Web App)"
              value={projName}
              maxLength={120}
              onChange={(e) => setProjName(e.target.value)}
            />
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!projName.trim() || createProject.isPending}
              onClick={() =>
                createProject.mutate({ workspaceId, name: projName.trim() })
              }
            >
              {createProject.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </div>
        )}
      </Step>

      {/* Step 3 — Repository */}
      <Step done={hasRepo} icon={GitBranch} title="Connect a repository" loading={loading}>
        {hasRepo ? (
          <p className="text-sm text-emerald-400">
            {linked.data!.length} repositor
            {linked.data!.length > 1 ? "ies" : "y"} linked.
          </p>
        ) : !ghConnected ? (
          <p className="text-sm text-muted-foreground">Connect GitHub first.</p>
        ) : !hasProject ? (
          <p className="text-sm text-muted-foreground">Create a project first.</p>
        ) : (
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
                {(available.data ?? []).map((r) => (
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
                <option value="">Select a project</option>
                {(projects.data ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!repoSel || !projSel || link.isPending}
                onClick={connectRepo}
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
        )}
      </Step>
    </div>
  );

  if (variant === "wizard") {
    return (
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="text-xl">Set up your workspace</CardTitle>
          <CardDescription>
            Three quick steps to a working AI delivery pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    );
  }

  // checklist
  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          Finish setting up
          <span className="text-xs font-normal text-muted-foreground">
            {doneCount}/3
          </span>
        </CardTitle>
        <CardDescription>
          Connect GitHub and link a repository to start shipping features.
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

function Step({
  done,
  icon: Icon,
  title,
  loading,
  children,
}: {
  done: boolean;
  icon: any;
  title: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 mb-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : done ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}
