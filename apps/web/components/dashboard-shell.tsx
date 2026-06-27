"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDown, Plus, Check, FolderKanban, LayoutList, Settings, User, GitCommit, LayoutDashboard, ShieldCheck } from "lucide-react";

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

  // Active workspace = the id in the URL (/dashboard/<id>/...), else the first.
  const parts = pathname.split("/").filter(Boolean); // ["dashboard", "<id>", ...]
  const urlId = parts[0] === "dashboard" ? parts[1] : undefined;
  const activeId =
    workspaces.find((w) => w.id === urlId)?.id ?? workspaces[0]?.id ?? null;
  const active = workspaces.find((w) => w.id === activeId);

  const is = (seg: string) => pathname.includes(`/${seg}`);

  const navLink = (seg: "projects" | "board" | "commits" | "reviews" | "settings", label: string, Icon: any) => {
    const href = activeId ? `/dashboard/${activeId}/${seg}` : "#";
    const activeCls = is(seg)
      ? "text-primary bg-primary/10"
      : "text-foreground hover:bg-muted hover:text-primary";
    return activeId ? (
      <Link href={href} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeCls}`}>
        <Icon className="h-4 w-4" /> {label}
      </Link>
    ) : (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
        <Icon className="h-4 w-4" /> {label}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground flex-col md:flex-row overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <span className="font-bold text-primary text-lg">ShipFlow AI</span>
        </div>

        {/* Workspace switcher */}
        <div className="px-2 pt-3 relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-background text-sm hover:border-primary/40"
          >
            <span className="truncate">{active?.name ?? "Select workspace"}</span>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
          {open && (
            <div className="absolute left-2 right-2 mt-1 z-50 rounded-md border border-border bg-card shadow-lg p-1">
              {workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/dashboard/${w.id}/board`);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted"
                >
                  <span className="truncate">{w.name}</span>
                  {w.id === activeId && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
              <Link
                href="/dashboard/onboarding"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:bg-muted hover:text-primary border-t border-border mt-1 pt-2"
              >
                <Plus className="h-4 w-4" /> New workspace
              </Link>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {/* Workspace home (bare /dashboard/<id>). */}
          <Link
            href={activeId ? `/dashboard/${activeId}` : "#"}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === `/dashboard/${activeId}`
                ? "text-primary bg-primary/10"
                : "text-foreground hover:bg-muted hover:text-primary"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          {navLink("projects", "Projects", FolderKanban)}
          {navLink("board", "Kanban Board", LayoutList)}
          {navLink("commits", "Commit Review", GitCommit)}
          {navLink("reviews", "Review History", ShieldCheck)}
          {navLink("settings", "Settings", Settings)}
          {/* Profile is per-user, not workspace-scoped. */}
          <Link
            href="/dashboard/profile"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname.startsWith("/dashboard/profile")
                ? "text-primary bg-primary/10"
                : "text-foreground hover:bg-muted hover:text-primary"
            }`}
          >
            <User className="h-4 w-4" /> Profile
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border bg-card">
          <span className="font-bold text-primary text-lg">ShipFlow AI</span>
          <span className="text-xs text-muted-foreground truncate max-w-[40%]">
            {active?.name}
          </span>
        </header>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 border-t border-border bg-card flex items-center justify-around z-50">
        {([
          { seg: "", label: "Home" },
          { seg: "projects", label: "Projects" },
          { seg: "board", label: "Board" },
          { seg: "reviews", label: "Reviews" },
          { seg: "settings", label: "Settings" },
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
            <Link key={label} href={href} className={`flex flex-col items-center justify-center w-full h-full ${cls}`}>
              <span className="text-xs font-medium mt-1">{label}</span>
            </Link>
          ) : (
            <div key={label} className="flex flex-col items-center justify-center w-full h-full text-muted-foreground opacity-50">
              <span className="text-xs font-medium mt-1">{label}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
