"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { SetupChecklist } from "@/components/setup-checklist";
import {
  Rocket,
  Gauge,
  FolderKanban,
  LayoutList,
  GitCommit,
  ArrowRight,
  Users,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Lightbulb,
  Activity,
  ListTodo
} from "lucide-react";

export default function WorkspaceDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ setup?: string }>;
}) {
  const { workspaceId } = use(params);
  const { setup } = use(searchParams);
  const isWizard = setup === "true";
  
  const metrics = trpc.review.getWorkspaceMetrics.useQuery({ workspaceId });
  const features = trpc.featureRequest.listByWorkspace.useQuery({ workspaceId });
  const taskMetrics = trpc.task.getDashboardMetrics.useQuery({ workspaceId });
  const comments = trpc.comment.getRecent.useQuery({ workspaceId });

  // Math for the distribution bar (mocked for new UI layout if data missing)
  const tCounts = taskMetrics.data?.statusCounts || {};
  const tTotal = taskMetrics.data?.totalTasks || 0; 
  
  // Custom Sparkline SVG Component
  const Sparkline = ({ color }: { color: string }) => (
    <svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
      <path d="M0 15C5 15 8 5 15 5C22 5 25 15 30 15C35 15 38 8 45 8C52 8 55 12 60 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="relative min-h-screen bg-[#000000] text-foreground flex flex-col p-6 md:p-8 overflow-x-hidden z-10">
      
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-[#c084fc]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Good morning, <span className="text-[#c084fc]">Team!</span> 👋
          </h1>
          <p className="text-[13.5px] text-muted-foreground">
            Here's what's happening in your command center.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-64 hidden md:block">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
               <Search className="h-4 w-4" />
             </div>
             <input 
               type="text" 
               placeholder="Search anything..." 
               className="w-full h-9 bg-[#111] border border-white/10 rounded-full pl-9 pr-8 text-[13px] text-white focus:outline-none focus:border-white/20 transition-colors"
             />
             <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground bg-white/5 border border-white/10 px-1.5 rounded">
               ⌘K
             </div>
          </div>
          
          {/* Notifications */}
          <button className="relative w-9 h-9 rounded-full bg-[#111] border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-black rounded-full flex items-center justify-center text-[8px] font-bold text-white">3</span>
          </button>
          
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c084fc] to-[#60a5fa] flex items-center justify-center border border-white/20 font-bold text-white text-[12px] shadow-[0_0_10px_rgba(192,132,252,0.3)]">
            TE
          </div>
        </div>
      </div>

      <SetupChecklist workspaceId={workspaceId} mode={isWizard ? "wizard" : "dashboard"} />

      {/* Date Picker (Mock) */}
      <div className="flex justify-end mb-4">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#111] border border-white/10 text-[12px] text-muted-foreground hover:bg-white/5 transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
           May 20, 2025
           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        
        {/* Features Shipped */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-[#4ade80]/30 transition-colors shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4ade80]/10 flex items-center justify-center border border-[#4ade80]/20 shadow-[0_0_15px_rgba(74,222,128,0.15)]">
                <Rocket className="h-5 w-5 text-[#4ade80]" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-muted-foreground">Features Shipped</div>
                <div className="text-3xl font-bold text-white mt-1">{metrics.isLoading ? "-" : (metrics.data?.shippedCount ?? 0)}</div>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
             <div className="text-[11px] font-medium"><span className="text-[#4ade80]">0%</span> <span className="text-muted-foreground">from last week</span></div>
             <Sparkline color="#4ade80" />
          </div>
        </div>

        {/* My Open Tasks */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-[#c084fc]/30 transition-colors shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#c084fc]/10 flex items-center justify-center border border-[#c084fc]/20 shadow-[0_0_15px_rgba(192,132,252,0.15)]">
                <ListTodo className="h-5 w-5 text-[#c084fc]" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-muted-foreground">My Open Tasks</div>
                <div className="text-3xl font-bold text-white mt-1">{taskMetrics.isLoading ? "-" : (taskMetrics.data?.myTasks.length ?? 0)}</div>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
             <div className="text-[11px] font-medium"><span className="text-[#4ade80]">0%</span> <span className="text-muted-foreground">from last week</span></div>
             <Sparkline color="#c084fc" />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-[#facc15]/30 transition-colors shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#facc15]/10 flex items-center justify-center border border-[#facc15]/20 shadow-[0_0_15px_rgba(250,204,21,0.15)]">
                <AlertTriangle className="h-5 w-5 text-[#facc15]" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-muted-foreground">Overdue (Workspace)</div>
                <div className="text-3xl font-bold text-white mt-1">{taskMetrics.isLoading ? "-" : (taskMetrics.data?.overdueTasks?.length ?? 0)}</div>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
             <div className="text-[11px] font-medium"><span className="text-[#4ade80]">0%</span> <span className="text-muted-foreground">from last week</span></div>
             <Sparkline color="#facc15" />
          </div>
        </div>

        {/* Avg Cycle Time */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-[#60a5fa]/30 transition-colors shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#60a5fa]/10 flex items-center justify-center border border-[#60a5fa]/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <Gauge className="h-5 w-5 text-[#60a5fa]" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-muted-foreground">Avg Cycle Time (hrs)</div>
                <div className="text-3xl font-bold text-white mt-1">{metrics.isLoading ? "-" : (metrics.data?.avgCycleHours ?? 0)}</div>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
             <div className="text-[11px] font-medium"><span className="text-[#4ade80]">0%</span> <span className="text-muted-foreground">from last week</span></div>
             <Sparkline color="#60a5fa" />
          </div>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
         
         {/* Workspace Task Distribution */}
         <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-sky-400" />
                <span className="font-semibold text-[14px]">Workspace Task Distribution</span>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#111] border border-white/10 text-[12px] text-muted-foreground hover:bg-white/5 transition-colors">
                This Week <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
            
            {/* Chart Legends */}
            <div className="flex gap-4 mb-8">
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#111] border border-white/5 text-[10px] font-bold text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.8)]" /> TODO 0
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#111] border border-white/5 text-[10px] font-bold text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.8)]" /> IN PROGRESS 0
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#111] border border-white/5 text-[10px] font-bold text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-[#0ea5e9] shadow-[0_0_8px_rgba(14,165,233,0.8)]" /> REVIEW 0
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#111] border border-white/5 text-[10px] font-bold text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.8)]" /> DONE 0
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
               {/* Left Donut Chart */}
               <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#0ea5e9" strokeWidth="12" strokeDasharray="0 251" strokeLinecap="round" className="opacity-80 drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-white">{tTotal}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">Total Tasks</span>
                  </div>
               </div>

               {/* Right Line Chart */}
               <div className="flex-1 w-full h-40 relative">
                  {/* Y Axis */}
                  <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-muted-foreground text-right pr-2">
                    <span>1.0</span>
                    <span>0.5</span>
                    <span>0</span>
                  </div>
                  {/* Grid Lines */}
                  <div className="absolute left-8 right-0 top-0 bottom-6 border-l border-b border-white/10 flex flex-col justify-between">
                    <div className="w-full h-px border-t border-dashed border-white/5"></div>
                    <div className="w-full h-px border-t border-dashed border-white/5"></div>
                    <div className="w-full h-px"></div>
                  </div>
                  {/* X Axis */}
                  <div className="absolute left-8 right-0 bottom-0 h-6 flex justify-between items-end text-[10px] text-muted-foreground px-4">
                    <span>May 14</span>
                    <span>May 15</span>
                    <span>May 16</span>
                    <span>May 17</span>
                    <span>May 18</span>
                    <span>May 19</span>
                    <span>May 20</span>
                  </div>
                  {/* Empty Data Line (Mock) */}
                  <div className="absolute left-8 right-0 bottom-6 h-px">
                     <svg width="100%" height="20" className="overflow-visible absolute bottom-0">
                       <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                       <circle cx="10%" cy="0" r="3" fill="#0ea5e9" className="shadow-[0_0_8px_rgba(14,165,233,0.8)]"/>
                       <circle cx="25%" cy="0" r="3" fill="#0ea5e9" className="shadow-[0_0_8px_rgba(14,165,233,0.8)]"/>
                       <circle cx="40%" cy="0" r="3" fill="#0ea5e9" className="shadow-[0_0_8px_rgba(14,165,233,0.8)]"/>
                       <circle cx="55%" cy="0" r="3" fill="#facc15" className="shadow-[0_0_8px_rgba(250,204,21,0.8)]"/>
                       <circle cx="70%" cy="0" r="3" fill="#facc15" className="shadow-[0_0_8px_rgba(250,204,21,0.8)]"/>
                       <circle cx="85%" cy="0" r="3" fill="#4ade80" className="shadow-[0_0_8px_rgba(74,222,128,0.8)]"/>
                       <circle cx="100%" cy="0" r="3" fill="#4ade80" className="shadow-[0_0_8px_rgba(74,222,128,0.8)]"/>
                     </svg>
                  </div>
               </div>
            </div>
         </div>

         {/* Recent Activity */}
         <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-[14px]">Recent Activity</span>
              </div>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#111] border border-white/10 text-[12px] text-muted-foreground hover:bg-white/5 transition-colors">
                View all <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
               <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                 {/* Glowing Isometric Box representation */}
                 <div className="absolute inset-0 bg-[#c084fc]/10 blur-[20px] rounded-full" />
                 <div className="relative w-16 h-12 bg-gradient-to-br from-[#c084fc]/40 to-[#c084fc]/10 border border-[#c084fc]/50 rounded-lg transform -rotate-12 skew-x-12 shadow-[0_0_30px_rgba(192,132,252,0.3)] backdrop-blur-sm flex items-center justify-center">
                    <Activity className="text-white/80 h-6 w-6 transform rotate-12 -skew-x-12" />
                 </div>
               </div>
               <h3 className="text-[15px] font-bold text-white mb-2">No recent activity yet</h3>
               <p className="text-[12px] text-muted-foreground leading-relaxed">
                 Once your team starts moving,<br />you'll see updates here.
               </p>
            </div>
         </div>
      </div>

      {/* Quick Links Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        
        <Link href={`/dashboard/${workspaceId}/projects`} className="group bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/5 rounded-xl p-4 transition-all flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#c084fc]/10 border border-[#c084fc]/20 shadow-[0_0_15px_rgba(192,132,252,0.15)] flex items-center justify-center shrink-0">
            <FolderKanban className="h-5 w-5 text-[#c084fc]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-white truncate">Projects</div>
            <div className="text-[11px] text-muted-foreground truncate">Create features & PRDs</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors shrink-0" />
        </Link>
        
        <Link href={`/dashboard/${workspaceId}/board`} className="group bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/5 rounded-xl p-4 transition-all flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 shadow-[0_0_15px_rgba(14,165,233,0.15)] flex items-center justify-center shrink-0">
            <LayoutList className="h-5 w-5 text-[#0ea5e9]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-white truncate">Kanban Board</div>
            <div className="text-[11px] text-muted-foreground truncate">Track engineering tasks</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors shrink-0" />
        </Link>
        
        <Link href={`/dashboard/${workspaceId}/commits`} className="group bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/5 rounded-xl p-4 transition-all flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 shadow-[0_0_15px_rgba(34,197,94,0.15)] flex items-center justify-center shrink-0">
            <GitCommit className="h-5 w-5 text-[#22c55e]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-white truncate">Commit Review</div>
            <div className="text-[11px] text-muted-foreground truncate">AI review of commits</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors shrink-0" />
        </Link>

        <Link href={`/dashboard/${workspaceId}/settings`} className="group bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/5 rounded-xl p-4 transition-all flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 border border-[#f97316]/20 shadow-[0_0_15px_rgba(249,115,22,0.15)] flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-[#f97316]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-white truncate">Team & Members</div>
            <div className="text-[11px] text-muted-foreground truncate">Invite your team</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors shrink-0" />
        </Link>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
        
        {/* My Active Tasks */}
        <div className="lg:col-span-1 bg-transparent border border-white/5 rounded-2xl p-5 border-dashed flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="h-5 w-5 text-[#c084fc]" />
            <span className="font-semibold text-[14px]">My Active Tasks</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4">
            <div className="w-12 h-12 mb-4 relative">
              <div className="absolute inset-0 bg-[#c084fc]/10 blur-[15px] rounded-full" />
              <ClipboardList className="w-full h-full text-[#c084fc] relative drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]" />
            </div>
            <p className="text-[12px] font-medium text-white">You have no assigned tasks.</p>
            <p className="text-[12px] text-muted-foreground mt-1">Grab some coffee! ☕</p>
          </div>
        </div>

        {/* Recent Feature Requests */}
        <div className="lg:col-span-2 bg-transparent border border-white/5 rounded-2xl p-5 border-dashed flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="h-5 w-5 text-[#facc15]" />
            <span className="font-semibold text-[14px]">Recent Feature Requests</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4">
            <div className="w-12 h-12 mb-4 relative">
              <div className="absolute inset-0 bg-[#facc15]/10 blur-[15px] rounded-full" />
              <Lightbulb className="w-full h-full text-[#facc15] relative drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
            </div>
            <p className="text-[12px] text-muted-foreground">
              Nothing yet — <br/>
              create one from <Link href={`/dashboard/${workspaceId}/projects`} className="text-[#c084fc] hover:underline font-medium">Projects</Link>.
            </p>
          </div>
        </div>

        {/* Team Health */}
        <div className="lg:col-span-1 bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-sky-400" />
            <span className="font-semibold text-[14px]">Team Health</span>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="relative w-20 h-20 shrink-0">
               <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                 <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                 <circle cx="50" cy="50" r="40" fill="none" stroke="#4ade80" strokeWidth="12" strokeDasharray="251 0" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(74,222,128,0.4)]" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                 <span className="text-[16px] font-bold text-white leading-none">100%</span>
                 <span className="text-[8px] font-semibold text-muted-foreground mt-0.5">On Track</span>
               </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border border-[#4ade80]/50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-2 w-2 text-[#4ade80]" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">No overdue tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border border-[#4ade80]/50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-2 w-2 text-[#4ade80]" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Good cycle time</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border border-[#4ade80]/50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-2 w-2 text-[#4ade80]" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Active contributors</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
