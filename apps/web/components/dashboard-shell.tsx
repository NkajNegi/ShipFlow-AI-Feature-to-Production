"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  ChevronsUpDown, 
  Plus, 
  Check, 
  FolderKanban, 
  LayoutList, 
  Settings, 
  User, 
  GitCommit, 
  LayoutDashboard, 
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Menu,
  X,
  Sparkles,
  Rocket
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Button } from "@/components/ui/button";

type WorkspaceLite = { id: string; name: string };

export function DashboardShell({
  workspaces,
  children,
}: {
  workspaces: WorkspaceLite[];
  children: ReactNode;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOutModalOpen, setIsSigningOutModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Active workspace = the id in the URL (/dashboard/<id>/...), else the first.
  const parts = pathname.split("/").filter(Boolean); // ["dashboard", "<id>", ...]
  const urlId = parts[0] === "dashboard" ? parts[1] : undefined;
  const activeId =
    workspaces.find((w) => w.id === urlId)?.id ?? workspaces[0]?.id ?? null;
  const active = workspaces.find((w) => w.id === activeId);

  const is = (seg: string) => pathname.includes(`/${seg}`);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          setIsSigningOut(false);
          setIsSigningOutModalOpen(false);
          router.push("/login");
        },
        onError: () => {
          setIsSigningOut(false);
          setIsSigningOutModalOpen(false);
        }
      },
    });
  };

  const navLink = (seg: "projects" | "board" | "commits" | "reviews" | "settings", label: string, Icon: any) => {
    const href = activeId ? `/dashboard/${activeId}/${seg}` : "#";
    const isActive = is(seg);
    const activeCls = isActive
      ? "text-white bg-gradient-to-r from-[#c084fc]/20 to-transparent border-r-2 border-[#c084fc] shadow-[inset_4px_0_15px_rgba(192,132,252,0.1)]"
      : "text-muted-foreground hover:bg-white/5 hover:text-white border-r-2 border-transparent";
      
    const content = (
      <>
        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#c084fc]' : 'text-muted-foreground'}`} />
        <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 font-medium'}`}>
          {label}
        </span>
      </>
    );

    return activeId ? (
      <Link href={href} title={isCollapsed ? label : undefined} className={`flex items-center gap-3 px-4 py-3 text-[13.5px] transition-all duration-200 group ${activeCls}`}>
        {content}
      </Link>
    ) : (
      <div title={isCollapsed ? label : undefined} className="flex items-center gap-3 px-4 py-3 text-[13.5px] text-muted-foreground opacity-50 cursor-not-allowed border-r-2 border-transparent">
        {content}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#000000] text-foreground flex-col md:flex-row overflow-hidden">
      
      {/* Background Radial Glow in the main layout */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-[#c084fc]/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] left-1/4 w-[500px] h-[500px] bg-[#60a5fa]/5 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#0a0a0c] border-r border-white/5 transition-all duration-300 ease-in-out relative z-20 shrink-0
        ${isCollapsed ? 'w-[72px]' : 'w-[260px]'}`}
      >
        <div className="h-16 flex items-center px-4 border-b border-transparent">
          <div className="flex items-center justify-between w-full">
            <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-full justify-center' : 'w-auto'}`}>
              {/* Logo S Box */}
              <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#222] to-[#111] border border-white/10 shadow-[0_0_15px_rgba(250,204,21,0.15)]">
                 <span className="text-[16px] font-extrabold text-[#facc15]">S</span>
              </div>
              
              <span className={`font-bold text-white text-[15px] whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                ShipFlow AI
              </span>
            </div>

            {!isCollapsed && (
              <div className="px-1.5 py-0.5 rounded text-[10px] font-bold text-muted-foreground bg-white/5 border border-white/10">
                K
              </div>
            )}
          </div>
        </div>

        {/* AI Features Section */}
        {!isCollapsed && (
           <div className="px-4 pt-6 pb-2">
             <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">AI Features</div>
             <button
               onClick={() => setOpen((v) => !v)}
               className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-white/10 bg-black/40 shadow-sm text-[13px] font-medium text-white hover:border-white/20 transition-all group"
             >
               <div className="flex items-center gap-2">
                 <Sparkles className="h-4 w-4 text-[#c084fc] group-hover:scale-110 transition-transform" />
                 <span className="truncate">{active?.name ?? "Select workspace"}</span>
               </div>
               <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
             </button>
             {open && (
               <div className="absolute left-4 right-4 mt-2 z-50 rounded-xl border border-white/10 bg-[#111] shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-200">
                 {workspaces.map((w) => (
                   <button
                     key={w.id}
                     onClick={() => {
                       setOpen(false);
                       router.push(`/dashboard/${w.id}`);
                     }}
                     className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-[13px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                   >
                     <span className="truncate">{w.name}</span>
                     {w.id === activeId && <Check className="h-4 w-4 text-[#c084fc]" />}
                   </button>
                 ))}
                 <Link
                   href="/dashboard/onboarding"
                   onClick={() => setOpen(false)}
                   className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-colors border-t border-white/5 mt-1 pt-2"
                 >
                   <Plus className="h-4 w-4" /> New workspace
                 </Link>
               </div>
             )}
           </div>
        )}

        <nav className="flex-1 mt-4 space-y-1 overflow-y-auto scrollbar-hide">
          {/* Workspace home (Dashboard) */}
          <Link
            href={activeId ? `/dashboard/${activeId}` : "#"}
            title={isCollapsed ? "Dashboard" : undefined}
            className={`flex items-center gap-3 px-4 py-3 text-[13.5px] transition-all duration-200 group ${
              pathname === `/dashboard/${activeId}`
                ? "text-white bg-gradient-to-r from-[#c084fc]/20 to-transparent border-r-2 border-[#c084fc] shadow-[inset_4px_0_15px_rgba(192,132,252,0.1)]"
                : "text-muted-foreground hover:bg-white/5 hover:text-white border-r-2 border-transparent"
            }`}
          >
            <LayoutDashboard className={`h-4 w-4 shrink-0 ${pathname === `/dashboard/${activeId}` ? 'text-[#c084fc]' : 'text-muted-foreground'}`} /> 
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 font-medium'}`}>
              Dashboard
            </span>
          </Link>
          
          {navLink("projects", "Projects", FolderKanban)}
          {navLink("board", "Kanban Board", LayoutList)}
          {navLink("commits", "Commit Review", GitCommit)}
          {navLink("reviews", "Review History", ShieldCheck)}
          {navLink("settings", "Settings", Settings)}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto px-4 pb-6 space-y-4">
          
          {/* Ship Smarter Promo Box */}
          {!isCollapsed && (
            <div className="rounded-xl border border-[#c084fc]/20 bg-[#c084fc]/5 p-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-20 h-20 bg-[#c084fc]/10 blur-[20px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
               <div className="w-8 h-8 rounded-lg bg-[#c084fc]/10 flex items-center justify-center mb-3">
                 <Rocket className="h-4 w-4 text-[#c084fc]" />
               </div>
               <div className="text-[13px] font-bold text-white mb-1">Ship smarter</div>
               <div className="text-[12px] text-muted-foreground leading-snug mb-3">
                 Let AI handle the busywork so you can focus on impact.
               </div>
               <button className="text-[12px] font-semibold text-[#c084fc] bg-[#c084fc]/10 border border-[#c084fc]/20 rounded-full px-3 py-1.5 w-full hover:bg-[#c084fc]/20 transition-colors">
                 Explore AI features →
               </button>
            </div>
          )}

          {/* User Profile & Logout */}
          <div className="pt-2">
            <Link
              href="/dashboard/profile"
              title={isCollapsed ? "Profile" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] font-medium transition-all duration-200 ${
                pathname.startsWith("/dashboard/profile")
                  ? "text-white bg-white/10"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              <User className="h-4 w-4 shrink-0" /> 
              <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                Profile
              </span>
            </Link>
            <button
              onClick={() => setIsSigningOutModalOpen(true)}
              title={isCollapsed ? "Log out" : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                Log out
              </span>
            </button>
          </div>
        </div>

      </aside>

      {/* Main content */}
      <main className="flex-1 relative flex flex-col min-w-0 overflow-y-auto scrollbar-hide bg-[#000000] z-10">
        
        {/* Mobile header */}
        <div className="md:hidden h-14 flex items-center justify-between px-4 border-b border-white/5 bg-[#0a0a0c] sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-gradient-to-br from-[#222] to-[#111] border border-white/10">
              <span className="text-[14px] font-extrabold text-[#facc15]">S</span>
            </div>
            <span className="font-bold text-white">ShipFlow</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 text-muted-foreground hover:text-white transition-colors rounded-md"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu (Slide-down) */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed top-14 inset-x-0 bottom-0 bg-[#000000] z-50 p-4 animate-in zoom-in-95 duration-200 space-y-4 overflow-y-auto">
            {/* Mobile Workspace Switcher */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Workspace</div>
              <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-[14px] font-medium text-white"
              >
                <span className="truncate">{active?.name ?? "Select workspace"}</span>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
              {open && (
                <div className="mt-2 rounded-xl border border-white/10 bg-[#0a0a0c] shadow-2xl p-2 animate-in fade-in zoom-in-95">
                  {workspaces.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setOpen(false);
                        setMobileMenuOpen(false);
                        router.push(`/dashboard/${w.id}/board`);
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[14px] text-white/80 hover:bg-white/10 transition-colors"
                    >
                      <span className="truncate">{w.name}</span>
                      {w.id === activeId && <Check className="h-4 w-4 text-[#c084fc]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-white/10 w-full" />
            
            <nav className="flex flex-col gap-1">
              <Link onClick={() => setMobileMenuOpen(false)} href={activeId ? `/dashboard/${activeId}` : "#"} className="flex items-center gap-3 px-3 py-3 rounded-lg text-white font-medium hover:bg-white/5"><LayoutDashboard className="h-5 w-5 text-[#c084fc]" /> Dashboard</Link>
              <Link onClick={() => setMobileMenuOpen(false)} href={activeId ? `/dashboard/${activeId}/projects` : "#"} className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground font-medium hover:bg-white/5 hover:text-white"><FolderKanban className="h-5 w-5" /> Projects</Link>
              <Link onClick={() => setMobileMenuOpen(false)} href={activeId ? `/dashboard/${activeId}/board` : "#"} className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground font-medium hover:bg-white/5 hover:text-white"><LayoutList className="h-5 w-5" /> Kanban Board</Link>
              <Link onClick={() => setMobileMenuOpen(false)} href={activeId ? `/dashboard/${activeId}/commits` : "#"} className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground font-medium hover:bg-white/5 hover:text-white"><GitCommit className="h-5 w-5" /> Commit Review</Link>
              <Link onClick={() => setMobileMenuOpen(false)} href={activeId ? `/dashboard/${activeId}/reviews` : "#"} className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground font-medium hover:bg-white/5 hover:text-white"><ShieldCheck className="h-5 w-5" /> Review History</Link>
              <Link onClick={() => setMobileMenuOpen(false)} href={activeId ? `/dashboard/${activeId}/settings` : "#"} className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground font-medium hover:bg-white/5 hover:text-white"><Settings className="h-5 w-5" /> Settings</Link>
            </nav>
            
            <div className="h-px bg-white/10 w-full" />
            
            <nav className="flex flex-col gap-1 pb-10">
              <Link onClick={() => setMobileMenuOpen(false)} href="/dashboard/profile" className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground font-medium hover:bg-white/5 hover:text-white"><User className="h-5 w-5" /> Profile</Link>
              <button onClick={() => setIsSigningOutModalOpen(true)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 font-medium hover:bg-red-500/10"><LogOut className="h-5 w-5" /> Log out</button>
            </nav>
          </div>
        )}

        {children}
      </main>

      {/* Sign Out Modal */}
      <ConfirmModal
        isOpen={isSigningOutModalOpen}
        onClose={() => setIsSigningOutModalOpen(false)}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmText={isSigningOut ? "Signing out..." : "Sign Out"}
        onConfirm={handleSignOut}
      />
    </div>
  );
}
