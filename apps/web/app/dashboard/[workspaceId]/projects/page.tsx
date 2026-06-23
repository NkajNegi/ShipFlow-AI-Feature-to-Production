"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Sparkles, Folder, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ProjectsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const resolvedParams = use(params);
  const workspaceId = resolvedParams.workspaceId;

  const { data: projects, isLoading, refetch } = trpc.project.list.useQuery({ workspaceId });
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      setIsProjectModalOpen(false);
      setNewProjectName("");
      refetch();
    }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2">Manage your projects and feature requests</p>
        </div>
        <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                A project organizes your feature requests and AI-generated PRDs.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Input
                  id="name"
                  placeholder="e.g. Mobile App Redesign"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => createProject.mutate({ workspaceId, name: newProjectName })}
                disabled={!newProjectName || createProject.isPending}
              >
                {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : projects?.length === 0 ? (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Folder className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Create a project to start organizing your feature requests and generating AI PRDs.
            </p>
            <Button onClick={() => setIsProjectModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {projects?.map((project) => (
            <ProjectCard key={project.id} project={project} workspaceId={workspaceId} />
          ))}
        </div>
      )}
    </div>
  );
}

// A component to display a project and its feature requests
function ProjectCard({ project, workspaceId }: { project: any; workspaceId: string }) {
  const { data: featureRequests, refetch } = trpc.featureRequest.list.useQuery({ projectId: project.id });
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");

  const createFeature = trpc.featureRequest.create.useMutation({
    onSuccess: () => {
      setIsFeatureModalOpen(false);
      setTitle("");
      setContext("");
      refetch();
    }
  });

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row justify-between items-start pb-4 border-b">
        <div>
          <CardTitle className="text-xl">{project.name}</CardTitle>
          <CardDescription>Manage feature requests for this project</CardDescription>
        </div>
        <Dialog open={isFeatureModalOpen} onOpenChange={setIsFeatureModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Feature Request</DialogTitle>
              <DialogDescription>
                Describe what you want to build. Our AI will generate a PRD and tasks for you.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Feature Title (e.g. Dark Mode)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Provide details about the feature, user needs, and context..."
                className="h-32"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button 
                onClick={() => createFeature.mutate({ projectId: project.id, title, context })}
                disabled={!title || !context || createFeature.isPending}
              >
                {createFeature.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-6">
        <details className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            Intake API — submit requests from email / tickets
          </summary>
          <div className="mt-3 space-y-2 text-xs">
            <p className="text-muted-foreground">
              POST to <code className="text-primary">/api/ingest/feature</code> with this project token:
            </p>
            <code className="block break-all rounded bg-background border border-border p-2">
              {project.ingestToken}
            </code>
            <pre className="overflow-x-auto rounded bg-background border border-border p-2 text-[11px] leading-relaxed">{`curl -X POST /api/ingest/feature \\
  -H 'content-type: application/json' \\
  -d '{"token":"${project.ingestToken}","title":"...","context":"...","source":"EMAIL"}'`}</pre>
          </div>
        </details>
        {featureRequests?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No feature requests yet.</p>
        ) : (
          <div className="space-y-4">
            {featureRequests?.map((fr) => (
              <div key={fr.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card">
                <div className="mb-4 md:mb-0">
                  <h4 className="font-semibold">{fr.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">{fr.context}</p>
                  <div className="mt-2 text-xs">
                    <span className="bg-primary/20 text-primary px-2 py-1 rounded-full">{fr.status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href={`/dashboard/${workspaceId}/feature/${fr.id}`}>
                      {fr.status === "DISCOVERY" ? (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" /> Start Discovery
                        </>
                      ) : (
                        <>
                          Open <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
