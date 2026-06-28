"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, CheckCircle2, AlertCircle, Info, Check } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "success" | "warning" | "info";
  unread: boolean;
};

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "PR #124 Approved",
    message: "AI Review completed successfully. No critical issues found.",
    time: "10m ago",
    type: "success",
    unread: true,
  },
  {
    id: "2",
    title: "Security Scan Warning",
    message: "Outdated dependency 'lodash' detected in package.json.",
    time: "1h ago",
    type: "warning",
    unread: true,
  },
  {
    id: "3",
    title: "New PRD Generated",
    message: "ShipFlow finished planning 'SSO Login Integration'.",
    time: "3h ago",
    type: "info",
    unread: true,
  },
];

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
          isOpen ? "bg-white/10 border-white/20" : "bg-[#111] border-white/10 hover:bg-white/5"
        }`}
      >
        <Bell className={`h-4 w-4 ${isOpen ? "text-white" : "text-muted-foreground"}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-black rounded-full flex items-center justify-center text-[8px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <h3 className="font-bold text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-white transition-colors"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            {notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`flex items-start gap-3 p-4 border-b border-white/5 transition-colors hover:bg-white/[0.02] ${notif.unread ? "bg-white/[0.02]" : ""}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getTypeIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-sm font-semibold truncate ${notif.unread ? "text-white" : "text-white/70"}`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                    {notif.unread && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <Bell className="w-8 h-8 text-white/10 mb-3" />
                <p className="text-sm text-muted-foreground">You're all caught up!</p>
              </div>
            )}
          </div>
          
          <div className="p-2 bg-[#050505] border-t border-white/5">
             <button className="w-full py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
               View all notifications
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
