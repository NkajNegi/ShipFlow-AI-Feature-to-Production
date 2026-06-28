"use client";

import { trpc } from "@/trpc/client";
import { RepoLinker } from "@/components/repo-linker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, GitBranch } from "lucide-react";

export function SetupChecklist({ 
  workspaceId, 
  mode 
}: { 
  workspaceId: string; 
  mode: "wizard" | "dashboard" 
}) {
  // 1. GitHub Connection Status (App installed on workspace?)
  const ghStatus = trpc.github.getStatus.useQuery({ workspaceId });
  const ghInstall = trpc.github.getInstallUrl.useQuery({ workspaceId });
  // 2. Repositories
  const repos = trpc.github.listLinkedRepositories.useQuery({ workspaceId });
  const hasRepo = (repos.data ?? []).length > 0;

  const isLoading = ghStatus.isLoading || repos.isLoading;

  if (isLoading) {
    if (mode === "wizard") {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      );
    }
    return null;
  }

  const isGitHubConnected = !!ghStatus.data?.connected;
  const isComplete = isGitHubConnected && hasRepo;

  // Auto-hide when complete
  if (isComplete) {
    return null;
  }

  const content = (
    <Card className="border-border w-full max-w-2xl mx-auto shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl">Get Started with MetroFlow AI</CardTitle>
        <CardDescription>
          Complete these 2 quick steps to enable PR sync and the AI review loop for your team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Step 1: Connect GitHub */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${isGitHubConnected ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
              {isGitHubConnected ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">1</span>}
            </div>
            <h3 className={`font-semibold ${isGitHubConnected ? "text-muted-foreground line-through" : "text-foreground"}`}>
              Connect GitHub App
            </h3>
          </div>
          {!isGitHubConnected && (
            <div className="ml-9 p-4 rounded-md border border-border bg-muted/40">
              <p className="text-sm text-muted-foreground mb-3">
                Install the GitHub App on your workspace to allow MetroFlow to read PRs and post reviews.
              </p>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <a href={ghInstall.data?.url ?? "#"}>
                  <GitBranch className="mr-2 h-4 w-4" /> Install GitHub App
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Step 2: Connect a Repository */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${hasRepo ? "bg-emerald-500/20 text-emerald-500" : (isGitHubConnected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}`}>
              {hasRepo ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">2</span>}
            </div>
            <h3 className={`font-semibold ${hasRepo ? "text-muted-foreground line-through" : (isGitHubConnected ? "text-foreground" : "text-muted-foreground")}`}>
              Link a Repository
            </h3>
          </div>
          {!hasRepo && isGitHubConnected && (
            <div className="ml-9 p-4 rounded-md border border-border bg-muted/40">
              <p className="text-sm text-muted-foreground mb-3">
                Connect the codebase where you'll be shipping features. A project will be automatically created for it.
              </p>
              <RepoLinker workspaceId={workspaceId} onSuccess={() => repos.refetch()} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (mode === "wizard") {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  // Dashboard mode
  return (
    <div className="mb-8">
      {content}
    </div>
  );
}
