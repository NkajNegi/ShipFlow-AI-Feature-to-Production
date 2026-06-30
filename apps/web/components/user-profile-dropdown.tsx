"use client";

import React, { useState, useRef, useEffect } from "react";
import { Settings, CreditCard, LifeBuoy, LogOut } from "lucide-react";
import Link from "next/link";

export function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-9 h-9 rounded-full bg-gradient-to-br from-[#c084fc] to-[#60a5fa] flex items-center justify-center border font-bold text-white text-[12px] shadow-[0_0_10px_rgba(192,132,252,0.3)] transition-all ${
          isOpen
            ? "border-white scale-105"
            : "border-white/20 hover:border-white/50"
        }`}
      >
        TE
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <p className="text-sm font-bold text-white truncate">
              Team Engineer
            </p>
            <p className="text-xs text-muted-foreground truncate">
              eng@shipflow.ai
            </p>
          </div>

          {/* Menu Items */}
          <div className="p-1">
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Workspace Settings
            </Link>
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Billing
            </Link>
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            >
              <LifeBuoy className="w-4 h-4" />
              Support
            </Link>
          </div>

          <div className="p-1 border-t border-white/5 bg-[#050505]">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
