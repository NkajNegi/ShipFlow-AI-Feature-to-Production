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
  X
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
    const activeCls = is(seg)
      ? "text-primary bg-primary/10 border-l-2 border-primary shadow-[inset_4px_0_10px_rgba(var(--primary),0.2)]"
      : "text-foreground hover:bg-white/5 hover:text-primary border-l-2 border-transparent";
      
    const content = (
      <>
        <Icon className="h-5 w-5 shrink-0" />
        <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
          {label}
        </span>
      </>
    );

    return activeId ? (
      <Link href={href} title={isCollapsed ? label : undefined} className={`flex items-center gap-3 px-3 py-2.5 rounded-r-md text-sm font-medium transition-all duration-200 ${activeCls} group`}>
        {content}
      </Link>
    ) : (
      <div title={isCollapsed ? label : undefined} className="flex items-center gap-3 px-3 py-2.5 rounded-r-md text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed border-l-2 border-transparent">
        {content}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground flex-col md:flex-row overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-white/5 bg-sidebar/60 backdrop-blur-xl transition-all duration-300 ease-in-out relative shadow-[4px_0_24px_rgba(0,0,0,0.2)]
        ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-border/50">
          <span className={`font-bold text-primary text-lg whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
            ShipFlow AI
          </span>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        {/* Workspace switcher */}
        <div className={`px-3 pt-4 pb-2 relative transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden pt-0' : 'opacity-100'}`}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border border-border/60 bg-background/50 backdrop-blur shadow-sm text-sm hover:border-primary/50 transition-all"
          >
            <span className="truncate font-medium">{active?.name ?? "Select workspace"}</span>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
          {open && (
            <div className="absolute left-3 right-3 mt-1.5 z-50 rounded-lg border border-border/80 bg-card/95 backdrop-blur-md shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-200">
              {workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/dashboard/${w.id}/board`);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-sm hover:bg-muted/80 transition-colors"
                >
                  <span className="truncate font-medium">{w.name}</span>
                  {w.id === activeId && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
              <Link
                href="/dashboard/onboarding"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted/80 hover:text-primary transition-colors border-t border-border/50 mt-1 pt-2"
              >
                <Plus className="h-4 w-4" /> New workspace
              </Link>
            </div>
          )}
        </div>

        {/* When collapsed, show a mini workspace icon or initial */}
        {isCollapsed && (
          <div className="px-3 pt-4 pb-2 flex justify-center">
            <div 
              className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold cursor-pointer hover:bg-primary/20 transition-colors"
              title={active?.name ?? "Workspace"}
              onClick={() => {
                setIsCollapsed(false);
                setOpen(true);
              }}
            >
              {active?.name ? active.name.charAt(0).toUpperCase() : "W"}
            </div>
          </div>
        )}

        <nav className="flex-1 px-0 py-2 space-y-1 overflow-y-auto scrollbar-hide">
          {/* Workspace home */}
          <Link
            href={activeId ? `/dashboard/${activeId}` : "#"}
            title={isCollapsed ? "Dashboard" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-r-md text-sm font-medium transition-all duration-200 group ${
              pathname === `/dashboard/${activeId}`
                ? "text-primary bg-primary/10 border-l-2 border-primary"
                : "text-foreground hover:bg-muted/80 hover:text-primary border-l-2 border-transparent"
            }`}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" /> 
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              Dashboard
            </span>
          </Link>
          
          {navLink("projects", "Projects", FolderKanban)}
          {navLink("board", "Kanban Board", LayoutList)}
          {navLink("commits", "Commit Review", GitCommit)}
          {navLink("reviews", "Review History", ShieldCheck)}
          {navLink("settings", "Settings", Settings)}
        </nav>

        {/* Bottom User Section */}
        <div className="mt-auto border-t border-border/50 p-3 space-y-1">
          <Link
            href="/dashboard/profile"
            title={isCollapsed ? "Profile" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
              pathname.startsWith("/dashboard/profile")
                ? "text-primary bg-primary/10"
                : "text-foreground hover:bg-muted/80 hover:text-primary"
            }`}
          >
            <User className="h-5 w-5 shrink-0" /> 
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              Profile
            </span>
          </Link>
          <button
            onClick={() => setIsSigningOutModalOpen(true)}
            title={isCollapsed ? "Log out" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              Log out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 bg-background relative z-0">
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border/50 bg-card/95 backdrop-blur-sm sticky top-0 z-10">
          <span className="font-bold text-primary text-lg">ShipFlow AI</span>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Dropdown Menu (Slide-down) */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-14 bg-card/95 backdrop-blur-md border-b border-border/50 shadow-xl z-40 p-4 animate-in slide-in-from-top-2 duration-200 space-y-4">
            
            {/* Mobile Workspace Switcher */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Workspace</div>
              <div className="relative">
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border border-border/60 bg-background/50 shadow-sm text-sm font-medium"
                >
                  <span className="truncate">{active?.name ?? "Select workspace"}</span>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
                {open && (
                  <div className="absolute left-0 right-0 mt-1 z-50 rounded-lg border border-border/80 bg-background shadow-xl p-1.5 animate-in fade-in zoom-in-95">
                    {workspaces.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => {
                          setOpen(false);
                          setMobileMenuOpen(false);
                          router.push(`/dashboard/${w.id}/board`);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-sm hover:bg-muted/80 transition-colors"
                      >
                        <span className="truncate font-medium">{w.name}</span>
                        {w.id === activeId && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                    <Link
                      href="/dashboard/onboarding"
                      onClick={() => {
                        setOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted/80 hover:text-primary transition-colors border-t border-border/50 mt-1 pt-2"
                    >
                      <Plus className="h-4 w-4" /> New workspace
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Account / Nav */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account</div>
              <div className="space-y-1">
                <Link
                  href={activeId ? `/dashboard/${activeId}/settings` : "#"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" /> Settings
                </Link>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  <User className="h-5 w-5 text-muted-foreground" /> Profile
                </Link>
                <button
                  onClick={() => setIsSigningOutModalOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-5 w-5 shrink-0" /> Log out
                </button>
              </div>
            </div>

          </div>
        )}

        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 border-t border-border/50 bg-card/95 backdrop-blur-md flex items-center justify-around z-50">
        {([
          { seg: "", label: "Home" },
          { seg: "projects", label: "Projects" },
          { seg: "board", label: "Board" },
          { seg: "reviews", label: "Reviews" },
        ] as const).map(({ seg, label }) => {
          const href = activeId
            ? seg
              ? `/dashboard/${activeId}/${seg}`
              : `/dashboard/${activeId}`
            : "#";
          const isActive = seg
            ? is(seg)
            : pathname === `/dashboard/${activeId}`;
          const cls = isActive ? "text-primary" : "text-muted-foreground hover:text-primary";
          return activeId ? (
            <Link key={label} href={href} className={`flex flex-col items-center justify-center w-full h-full ${cls} transition-colors`}>
              <span className="text-[10px] font-medium mt-1">{label}</span>
            </Link>
          ) : (
            <div key={label} className="flex flex-col items-center justify-center w-full h-full text-muted-foreground opacity-50">
              <span className="text-[10px] font-medium mt-1">{label}</span>
            </div>
          );
        })}
      </nav>
      {/* Logout Modal */}
      <ConfirmModal
        isOpen={isSigningOutModalOpen}
        onClose={() => setIsSigningOutModalOpen(false)}
        title="Sign out"
        description="Are you sure you want to sign out?"
        confirmText="Sign out"
        confirmVariant="destructive"
        onConfirm={handleSignOut}
        isPending={isSigningOut}
      />
    </div>
  );
}
