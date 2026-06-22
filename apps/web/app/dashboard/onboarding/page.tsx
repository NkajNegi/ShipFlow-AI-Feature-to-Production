"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  const createWorkspace = trpc.workspace.createWorkspace.useMutation({
    onSuccess: (data) => {
      utils.workspace.getUserWorkspaces.invalidate();
      router.push(`/dashboard/${data.id}/board`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createWorkspace.mutate({ name });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-primary">Welcome to ShipFlow AI</CardTitle>
          <CardDescription>Let's set up your first workspace to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspaceName">Workspace Name</Label>
              <Input
                id="workspaceName"
                placeholder="e.g. Acme Corp"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createWorkspace.isLoading}
                className="border-border focus:border-primary"
              />
            </div>
            
            {createWorkspace.isError && (
              <p className="text-sm text-red-500">{createWorkspace.error.message}</p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={createWorkspace.isLoading}
            >
              {createWorkspace.isLoading ? "Creating..." : "Create Workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
