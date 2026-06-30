"use client";

import { useState, use, useMemo, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { Loader2, Plus, Search, User as UserIcon, Calendar, Trash2, Tag, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const COLUMNS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const COLUMN_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "AI Review",
  DONE: "Done",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  MEDIUM: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  HIGH: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  URGENT: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function KanbanBoardPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const resolvedParams = use(params);
  const workspaceId = resolvedParams.workspaceId;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Filters & View State
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [groupBy, setGroupBy] = useState<"NONE" | "PROJECT" | "ASSIGNEE">("NONE");

  // Queries
  const { data: tasks, isLoading, refetch } = trpc.task.listByWorkspace.useQuery({ 
    workspaceId, 
    ...(search ? { search } : {}),
    ...(projectId ? { projectId } : {}),
    ...(assigneeId ? { assigneeId } : {})
  });
  
  const projects = trpc.project.list.useQuery({ workspaceId });
  const members = trpc.workspace.getMembers.useQuery({ workspaceId });
  const labels = trpc.label.listByWorkspace.useQuery({ workspaceId });
  
  const utils = trpc.useUtils();
  
  // Mutations
  const updateTask = trpc.task.update.useMutation({
    onMutate: async (newInfo) => {
      await utils.task.listByWorkspace.cancel();
      const queryKey = { workspaceId, ...(search ? { search } : {}), ...(projectId ? { projectId } : {}), ...(assigneeId ? { assigneeId } : {}) };
      const prevData = utils.task.listByWorkspace.getData(queryKey);
      
      if (prevData) {
        utils.task.listByWorkspace.setData(queryKey, (old) => {
          if (!old) return old;
          return old.map(t => 
            t.id === newInfo.taskId 
              ? { 
                  ...t, 
                  ...newInfo, 
                  status: newInfo.status ?? t.status,
                  dueDate: newInfo.dueDate ? new Date(newInfo.dueDate) : (newInfo.dueDate === null ? null : t.dueDate)
                } 
              : t
          ).sort((a, b) => (a.position || 0) - (b.position || 0));
        });
      }
      return { prevData, queryKey };
    },
    onError: (err, newInfo, context) => {
      if (context?.prevData) {
        utils.task.listByWorkspace.setData(context.queryKey, context.prevData);
      }
    },
    onSettled: () => refetch(),
  });

  const createTask = trpc.task.create.useMutation({
    onSuccess: () => { refetch(); setIsModalOpen(false); }
  });

  const deleteTask = trpc.task.delete.useMutation({
    onSuccess: () => {
      setTaskToDelete(null);
      setIsModalOpen(false);
      refetch();
    },
  });

  const createComment = trpc.comment.create.useMutation({
    onSuccess: () => refetch(),
  });

  const syncGithub = trpc.task.syncGithub.useMutation({
    onSuccess: (data) => {
      alert(
        `GitHub sync complete — ${data.synced} task${data.synced === 1 ? "" : "s"} updated from pull requests.`
      );
      refetch();
    },
    onError: (err) => alert(err.message),
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const editingTask = useMemo(() => tasks?.find(t => t.id === editingTaskId) || null, [tasks, editingTaskId]);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPriority, setFormPriority] = useState("MEDIUM");
  const [formAssignee, setFormAssignee] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formLabels, setFormLabels] = useState<string[]>([]);
  const [newComment, setNewComment] = useState("");

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    
    // Calculate new position
    const destColId = destination.droppableId;
    const [swimlaneGroup, newStatus] = destColId.includes("|") ? destColId.split("|") : ["ALL", destColId];
    
    // Get tasks in that column/swimlane
    let destTasks = tasks?.filter(t => t.status === newStatus) || [];
    if (groupBy === "PROJECT" && swimlaneGroup !== "ALL") destTasks = destTasks.filter(t => t.projectId === swimlaneGroup);
    if (groupBy === "ASSIGNEE" && swimlaneGroup !== "ALL") destTasks = destTasks.filter(t => t.assigneeId === swimlaneGroup);
    
    // Remove the dragged task if it was already in this column to calculate position correctly
    destTasks = destTasks.filter(t => t.id !== draggableId).sort((a,b) => a.position - b.position);
    
    // Calculate fractional position
    let newPosition = 0;
    if (destTasks.length === 0) {
      newPosition = 1000;
    } else if (destination.index === 0) {
      newPosition = destTasks[0]!.position - 1000;
    } else if (destination.index >= destTasks.length) {
      newPosition = destTasks[destTasks.length - 1]!.position + 1000;
    } else {
      const prev = destTasks[destination.index - 1]!.position;
      const next = destTasks[destination.index]!.position;
      newPosition = (prev + next) / 2;
    }

    const task = tasks?.find(t => t.id === draggableId);
    
    // Check if anything actually changed
    let hasChanged = false;
    if (task) {
      if (task.status !== newStatus) hasChanged = true;
      if (Math.abs(task.position - newPosition) > 0.001) hasChanged = true;
      if (groupBy === "PROJECT" && swimlaneGroup !== "ALL") {
        const expectedProjectId = swimlaneGroup === "UNASSIGNED" ? null : swimlaneGroup;
        if (task.projectId !== expectedProjectId) hasChanged = true;
      }
      if (groupBy === "ASSIGNEE" && swimlaneGroup !== "ALL") {
        const expectedAssigneeId = swimlaneGroup === "UNASSIGNED" ? null : swimlaneGroup;
        if (task.assigneeId !== expectedAssigneeId) hasChanged = true;
      }
    }

    if (task && hasChanged) {
      const updatePayload: any = { 
        taskId: draggableId, 
        status: newStatus as any,
        position: newPosition
      };
      
      if (groupBy === "PROJECT" && swimlaneGroup !== "ALL") {
        updatePayload.projectId = swimlaneGroup === "UNASSIGNED" ? null : swimlaneGroup;
      }
      if (groupBy === "ASSIGNEE" && swimlaneGroup !== "ALL") {
        updatePayload.assigneeId = swimlaneGroup === "UNASSIGNED" ? null : swimlaneGroup;
      }

      updateTask.mutate(updatePayload);
    }
  };

  const openNewTask = () => {
    setEditingTaskId(null);
    setFormTitle("");
    setFormDesc("");
    setFormPriority("MEDIUM");
    setFormAssignee("");
    setFormProject(projectId || "");
    setFormDueDate("");
    setFormLabels([]);
    setIsModalOpen(true);
  };

  const openEditTask = (task: any) => {
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormDesc(task.description);
    setFormPriority(task.priority);
    setFormAssignee(task.assigneeId || "");
    setFormProject(task.projectId || "");
    setFormDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0]! : "");
    setFormLabels(task.labels?.map((l: any) => l.labelId) || []);
    setIsModalOpen(true);
  };

  const saveTask = () => {
    if (editingTaskId) {
      updateTask.mutate({
        taskId: editingTaskId,
        title: formTitle,
        description: formDesc,
        priority: formPriority as any,
        assigneeId: formAssignee || null,
        dueDate: formDueDate || null,
        labelIds: formLabels,
      }, { onSuccess: () => setIsModalOpen(false) });
    } else {
      createTask.mutate({
        projectId: formProject,
        title: formTitle,
        description: formDesc,
        priority: formPriority as any,
        assigneeId: formAssignee || undefined,
        dueDate: formDueDate || undefined,
        labelIds: formLabels,
      });
    }
  };

  const postComment = () => {
    if (!newComment.trim() || !editingTask) return;
    createComment.mutate({ taskId: editingTask.id, content: newComment });
    setNewComment("");
  };

  // Group tasks by Swimlanes
  const swimlanes = useMemo(() => {
    if (!tasks) return [];
    
    if (groupBy === "NONE") {
      return [{ id: "ALL", title: "All Tasks", tasks }];
    }
    
    if (groupBy === "PROJECT") {
      const projectMap = new Map<string, { id: string, title: string, tasks: any[] }>();
      projects.data?.forEach(p => projectMap.set(p.id, { id: p.id, title: p.name, tasks: [] }));
      projectMap.set("UNASSIGNED", { id: "UNASSIGNED", title: "No Project", tasks: [] });
      
      tasks.forEach(t => {
        // PRD-generated tasks have no direct projectId; resolve via the PRD's feature.
        const pid = t.projectId ?? t.prd?.featureRequest?.project?.id ?? null;
        if (pid && projectMap.has(pid)) projectMap.get(pid)!.tasks.push(t);
        else projectMap.get("UNASSIGNED")!.tasks.push(t);
      });
      return Array.from(projectMap.values()).filter(s => s.tasks.length > 0 || s.id !== "UNASSIGNED");
    }
    
    if (groupBy === "ASSIGNEE") {
      const assigneeMap = new Map<string, { id: string, title: string, tasks: any[] }>();
      members.data?.forEach(m => assigneeMap.set(m.userId, { id: m.userId, title: m.user.name || m.user.email, tasks: [] }));
      assigneeMap.set("UNASSIGNED", { id: "UNASSIGNED", title: "Unassigned", tasks: [] });
      
      tasks.forEach(t => {
        if (t.assigneeId && assigneeMap.has(t.assigneeId)) assigneeMap.get(t.assigneeId)!.tasks.push(t);
        else assigneeMap.get("UNASSIGNED")!.tasks.push(t);
      });
      return Array.from(assigneeMap.values()).filter(s => s.tasks.length > 0 || s.id !== "UNASSIGNED");
    }
    
    return [];
  }, [tasks, groupBy, projects.data, members.data]);

  if (!mounted) return null;

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Engineering Board</h1>
          <p className="text-muted-foreground text-sm">Manage PRD tasks and bug fixes.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openNewTask} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
          <Button variant="outline" onClick={() => syncGithub.mutate({ workspaceId })} disabled={syncGithub.isPending}>
            {syncGithub.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Sync GitHub
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-8 bg-[#0c0c0c]/80 backdrop-blur-xl p-3 px-6 rounded-full border border-white/10 shadow-lg items-center sticky top-4 z-40">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <select 
          className="rounded-md border border-border bg-background px-3 py-2 text-sm min-w-[150px]"
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.data?.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select 
          className="rounded-md border border-border bg-background px-3 py-2 text-sm min-w-[150px]"
          value={assigneeId}
          onChange={e => setAssigneeId(e.target.value)}
        >
          <option value="">All Assignees</option>
          {members.data?.map(m => (
            <option key={m.userId} value={m.userId}>{m.user.name || m.user.email}</option>
          ))}
        </select>
        <div className="h-6 w-px bg-border mx-2"></div>
        <Label className="text-muted-foreground text-sm whitespace-nowrap">Group By:</Label>
        <select 
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={groupBy}
          onChange={e => setGroupBy(e.target.value as any)}
        >
          <option value="NONE">None</option>
          <option value="PROJECT">Project</option>
          <option value="ASSIGNEE">Assignee</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto pb-4 flex flex-col gap-8">
            {swimlanes.map(swimlane => (
              <div key={swimlane.id} className="min-w-max flex flex-col">
                {groupBy !== "NONE" && (
                  <h2 className="text-lg font-bold text-foreground mb-4 sticky left-0">{swimlane.title}</h2>
                )}
                <div className="flex gap-6 items-start">
                  {COLUMNS.map((colId) => {
                    const colTasks = swimlane.tasks.filter(t => t.status === colId).sort((a,b) => a.position - b.position);
                    const droppableId = `${swimlane.id}|${colId}`;
                    
                    return (
                      <div key={colId} className="w-80 flex flex-col bg-sidebar/50 backdrop-blur-xl rounded-xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
                        <div className="p-4 border-b border-white/5 bg-background/40 rounded-t-xl backdrop-blur-xl">
                          <h3 className="font-semibold text-foreground flex items-center justify-between">
                            {COLUMN_LABELS[colId]}
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              {colTasks.length}
                            </span>
                          </h3>
                        </div>
                        
                        <Droppable droppableId={droppableId}>
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`p-4 space-y-3 flex-1 min-h-[150px] transition-colors ${
                                snapshot.isDraggingOver ? "bg-muted/30" : ""
                              }`}
                            >
                              {colTasks.map((task, index) => {
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                                return (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      onClick={() => openEditTask(task)}
                                      className={`spotlight-card glass p-4 rounded-lg shadow-sm border transition-all duration-300 cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 group ${
                                        snapshot.isDragging ? "border-primary shadow-xl scale-[1.05] z-50 ring-2 ring-primary/20" : "border-white/10"
                                      }`}
                                      style={provided.draggableProps.style}
                                    >
                                      <div className="flex justify-between items-start mb-2 gap-2">
                                        <div className="flex gap-2 flex-wrap">
                                          <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                            {task.prd?.featureRequest?.title || task.project?.name || "Task"}
                                          </span>
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${PRIORITY_COLORS[task.priority]}`}>
                                            {task.priority}
                                          </span>
                                        </div>
                                      </div>
                                      <h4 className="text-sm font-medium text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                                        {task.title}
                                      </h4>
                                      
                                      {/* Labels */}
                                      {task.labels && task.labels.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                          {task.labels.map((tl: any) => (
                                            <span key={tl.labelId} className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: tl.label.color }}>
                                              {tl.label.name}
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      <div className="flex justify-between items-end mt-3 pt-3 border-t border-border/50">
                                        <div className="flex flex-col gap-1">
                                          <span className="text-xs text-muted-foreground font-mono">SF-{task.ref}</span>
                                          {task.dueDate && (
                                            <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                              <Calendar className="h-3 w-3" />
                                              {new Date(task.dueDate).toLocaleDateString()}
                                            </span>
                                          )}
                                        </div>
                                        {task.assignee ? (
                                          <div className="h-6 w-6 rounded-full overflow-hidden bg-muted border border-border shrink-0" title={task.assignee.name || "Assigned"}>
                                            {task.assignee.image ? (
                                              <img src={task.assignee.image} alt="Avatar" className="h-full w-full object-cover" />
                                            ) : (
                                              <div className="h-full w-full flex items-center justify-center text-[10px] font-bold bg-primary/10 text-primary">
                                                {(task.assignee.name || "?").charAt(0).toUpperCase()}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="h-6 w-6 rounded-full flex items-center justify-center border border-dashed border-muted-foreground/50 text-muted-foreground/50 shrink-0" title="Unassigned">
                                            <UserIcon className="h-3 w-3" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Advanced Task Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className={`max-w-[900px] border-border bg-card max-h-[90vh] overflow-y-auto`}>
          <DialogHeader className="flex flex-row justify-between items-start">
            <DialogTitle className="text-xl">{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
            {editingTask && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 mr-4" 
                onClick={() => setTaskToDelete({ id: editingTask.id, title: editingTask.title })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </DialogHeader>

          <div className={`grid gap-6 py-4 ${editingTask ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Left Column: Form */}
            <div className="space-y-4">
              {!editingTask && (
                <div className="space-y-2">
                  <Label>Project <span className="text-red-500">*</span></Label>
                  <select 
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={formProject}
                    onChange={e => setFormProject(e.target.value)}
                  >
                    <option value="" disabled>Select a project</option>
                    {projects.data?.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="bg-background text-base font-medium" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={formDesc} 
                  onChange={e => setFormDesc(e.target.value)} 
                  className="min-h-[150px] bg-background" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select 
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <select 
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={formAssignee}
                    onChange={e => setFormAssignee(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {members.data?.map(m => (
                      <option key={m.userId} value={m.userId}>{m.user.name || m.user.email}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="bg-background" />
                </div>
                
                <div className="space-y-2 col-span-2 border-t border-border pt-4">
                  <Label>Labels</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {labels.data?.map((l: any) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setFormLabels(prev => prev.includes(l.id) ? prev.filter(id => id !== l.id) : [...prev, l.id])}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${
                          formLabels.includes(l.id) ? 'text-white border-transparent' : 'text-muted-foreground bg-transparent hover:bg-muted'
                        }`}
                        style={formLabels.includes(l.id) ? { backgroundColor: l.color } : { borderColor: l.color }}
                      >
                        {l.name}
                      </button>
                    ))}
                    {labels.data?.length === 0 && (
                      <span className="text-xs text-muted-foreground italic">No labels created in this workspace yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Comments (Only when editing) */}
            {editingTask && (
              <div className="border-l border-border pl-6 flex flex-col max-h-[500px]">
                <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                  Activity & Comments
                  <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                    {editingTask.comments?.length || 0}
                  </span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                  {editingTask.comments?.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
                      No comments yet. Start the conversation!
                    </div>
                  ) : (
                    editingTask.comments?.map((c: any) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted shrink-0 overflow-hidden border border-border mt-1">
                          {c.author.image ? <img src={c.author.image} alt="Avatar" /> : <UserIcon className="h-full w-full p-1.5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{c.author.name}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-foreground mt-0.5 bg-muted/30 p-2 rounded-md border border-border/50">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Input 
                    placeholder="Add a comment..." 
                    value={newComment} 
                    onChange={e => setNewComment(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && postComment()}
                    className="bg-background"
                  />
                  <Button size="icon" onClick={postComment} disabled={!newComment.trim() || createComment.isPending} className="shrink-0">
                    {createComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border pt-4 mt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={saveTask} 
              disabled={!formTitle || (!editingTask && !formProject) || updateTask.isPending || createTask.isPending}
            >
              {(updateTask.isPending || createTask.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
        onConfirm={() => {
          if (taskToDelete) {
            deleteTask.mutate({ taskId: taskToDelete.id });
          }
        }}
        isPending={deleteTask.isPending}
      />
    </div>
  );
}
