"use client";

import { useState, use } from "react";
import { trpc } from "@/trpc/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLUMNS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const COLUMN_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "AI Review",
  DONE: "Done",
};

export default function KanbanBoardPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const resolvedParams = use(params);
  const workspaceId = resolvedParams.workspaceId;

  const { data: tasks, isLoading, refetch } = trpc.task.listByWorkspace.useQuery({ workspaceId });
  const updateStatus = trpc.task.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedTaskId) {
      updateStatus.mutate({ taskId: draggedTaskId, status });
      setDraggedTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group tasks by status
  const tasksByStatus: Record<string, any[]> = {
    TODO: [],
    IN_PROGRESS: [],
    REVIEW: [],
    DONE: [],
  };

  tasks?.forEach(task => {
    if (tasksByStatus[task.status]) {
      tasksByStatus[task.status].push(task);
    } else {
      tasksByStatus["TODO"].push(task); // Fallback
    }
  });

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Engineering Tasks</h1>
          <p className="text-muted-foreground text-sm">Manage tasks generated from PRDs.</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          Sync GitHub
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 h-full min-w-max">
          {COLUMNS.map((colId) => (
            <div 
              key={colId}
              className="w-80 flex flex-col bg-card/50 rounded-lg border border-border"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, colId)}
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground flex items-center justify-between">
                  {COLUMN_LABELS[colId]}
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {tasksByStatus[colId].length}
                  </span>
                </h3>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {tasksByStatus[colId].length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-md">
                    Drop here
                  </div>
                ) : (
                  tasksByStatus[colId].map((task) => (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-card p-4 rounded-md shadow-sm border border-border hover:border-primary/50 transition-colors cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {task.prd?.featureRequest?.title || "Task"}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-foreground mb-1">{task.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
