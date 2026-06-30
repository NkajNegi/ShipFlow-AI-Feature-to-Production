"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, AlertCircle, Info, Check } from "lucide-react";
import { trpc } from "@/trpc/client";

function timeAgo(d: Date | string) {
  const t = new Date(d).getTime();
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function getTypeIcon(type: string) {
  switch (type) {
    case "success":
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case "warning":
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    default:
      return <Info className="w-4 h-4 text-blue-400" />;
  }
}

export function NotificationPopover({ workspaceId }: { workspaceId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const q = trpc.notification.getForWorkspace.useQuery(
    { workspaceId: workspaceId ?? "" },
    { enabled: !!workspaceId, refetchInterval: 120_000 },
  );
  const items = q.data ?? [];

  const seenKey = `notif_seen_${workspaceId ?? "_"}`;

  // Load the locally-stored "seen" timestamp.
  useEffect(() => {
    const v =
      typeof window !== "undefined" ? localStorage.getItem(seenKey) : null;
    setLastSeen(v ? Number(v) : 0);
  }, [seenKey]);

  const unreadCount = items.filter(
    (n) => new Date(n.createdAt).getTime() > lastSeen,
  ).length;

  const markAllAsRead = () => {
    const now = Date.now();
    if (typeof window !== "undefined")
      localStorage.setItem(seenKey, String(now));
    setLastSeen(now);
  };

  // Opening the tray counts as seeing the notifications → clears the badge.
  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && unreadCount > 0) markAllAsRead();
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={toggleOpen}
        className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
          isOpen
            ? "bg-white/10 border-white/20"
            : "bg-[#111] border-white/10 hover:bg-white/5"
        }`}
      >
        <Bell
          className={`h-4 w-4 ${isOpen ? "text-white" : "text-muted-foreground"}`}
        />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-black rounded-full flex items-center justify-center text-[8px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <h3 className="font-bold text-white text-sm">Notifications</h3>
            {items.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-white transition-colors"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            {q.isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : items.length > 0 ? (
              <div className="flex flex-col">
                {items.map((notif) => {
                  const unread = new Date(notif.createdAt).getTime() > lastSeen;
                  const Row = (
                    <div
                      className={`flex items-start gap-3 p-4 border-b border-white/5 transition-colors hover:bg-white/[0.02] ${
                        unread ? "bg-white/[0.02]" : ""
                      } ${notif.href ? "cursor-pointer" : ""}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getTypeIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`text-sm font-semibold truncate ${
                              unread ? "text-white" : "text-white/70"
                            }`}
                          >
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                            {timeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                      {unread && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      )}
                    </div>
                  );
                  return notif.href ? (
                    <Link
                      key={notif.id}
                      href={notif.href}
                      onClick={() => setIsOpen(false)}
                    >
                      {Row}
                    </Link>
                  ) : (
                    <div key={notif.id}>{Row}</div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <Bell className="w-8 h-8 text-white/10 mb-3" />
                <p className="text-sm text-muted-foreground">
                  You're all caught up!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
