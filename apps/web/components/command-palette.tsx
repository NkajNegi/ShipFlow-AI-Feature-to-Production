"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  LayoutList,
  ShieldCheck,
  GitCommit,
  BarChart,
  Inbox,
  CheckCircle2,
  Calendar,
  Settings,
  Bot,
  User,
  CornerDownLeft,
} from "lucide-react";

type Item = {
  label: string;
  hint?: string;
  icon: any;
  run: () => void;
  keywords?: string;
};

/**
 * Global command palette (⌘K / Ctrl+K). Dependency-free: a filterable list with
 * full keyboard navigation. Mounted once in the dashboard shell.
 */
export function CommandPalette({ workspaceId }: { workspaceId: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle on ⌘K / Ctrl+K (ignore while typing in a field, except to close).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("command-palette:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("command-palette:open", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // focus after the modal paints
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const items: Item[] = useMemo(() => {
    const go = (seg: string) => () => {
      if (workspaceId) router.push(`/dashboard/${workspaceId}/${seg}`);
      setOpen(false);
    };
    return [
      { label: "Overview", icon: LayoutDashboard, run: () => { if (workspaceId) router.push(`/dashboard/${workspaceId}`); setOpen(false); }, keywords: "home dashboard" },
      { label: "Projects", icon: FolderKanban, run: go("projects"), keywords: "features requests" },
      { label: "Engineering board", icon: LayoutList, run: go("board"), keywords: "tasks kanban" },
      { label: "Reviews", icon: ShieldCheck, run: go("reviews"), keywords: "ai review pr" },
      { label: "Commits", icon: GitCommit, run: go("commits"), keywords: "commit review" },
      { label: "Analytics", icon: BarChart, run: go("analytics"), keywords: "metrics throughput" },
      { label: "Inbox", icon: Inbox, run: go("inbox"), keywords: "intake email" },
      { label: "Approval queue", icon: CheckCircle2, run: go("queue"), keywords: "approve human gate" },
      { label: "Calendar", icon: Calendar, run: go("calendar"), keywords: "schedule" },
      { label: "AI Agent", icon: Bot, run: go("agent"), keywords: "copilot chat" },
      { label: "Settings", icon: Settings, run: go("settings"), keywords: "github billing workspace" },
      { label: "Profile", icon: User, run: () => { router.push(`/dashboard/profile`); setOpen(false); }, keywords: "account byok api key" },
    ];
  }, [router, workspaceId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.keywords?.toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [filtered.length, active]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10] shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                filtered[active]?.run();
              }
            }}
            placeholder="Search pages and actions…"
            className="flex-1 bg-transparent py-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[340px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches.
            </p>
          ) : (
            filtered.map((it, i) => (
              <button
                key={it.label}
                onMouseEnter={() => setActive(i)}
                onClick={() => it.run()}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  i === active
                    ? "bg-white/[0.07] text-white"
                    : "text-muted-foreground hover:bg-white/[0.04]"
                }`}
              >
                <it.icon
                  className={`h-4 w-4 shrink-0 ${i === active ? "text-[#c084fc]" : ""}`}
                />
                <span className="flex-1">{it.label}</span>
                {i === active && (
                  <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
