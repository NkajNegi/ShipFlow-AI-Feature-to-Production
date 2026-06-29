"use client";

import React from "react";
import { MessageSquare, ListTodo, Code, ShieldCheck, Rocket } from "lucide-react";

export function HeroOrbitalGraphic() {
  return (
    <div className="relative w-full h-full min-h-[500px] flex items-center justify-center pt-10 select-none overflow-visible">
      {/* Dynamic Scaling Wrapper for Responsiveness */}
      <div className="relative transform scale-[0.7] xl:scale-[0.85] 2xl:scale-100 origin-center transition-transform duration-300 w-full h-full flex items-center justify-center">
        
        {/* Central Glowing M */}
        <div className="absolute z-20 w-[140px] h-[140px] flex items-center justify-center">
          <div className="absolute inset-0 bg-[#F5A524]/30 blur-[80px] rounded-full scale-150 pointer-events-none animate-pulse" />
          <div 
            className="relative w-full h-full rounded-[30px] flex items-center justify-center shadow-[0_0_100px_rgba(245,165,36,0.4)]"
            style={{
              background: "linear-gradient(135deg, #2a1600 0%, #0c0800 100%)",
              border: "1px solid rgba(245,165,36,0.5)",
              boxShadow: "inset 0 2px 10px rgba(245,165,36,0.5), 0 10px 40px rgba(0,0,0,0.8), 0 0 80px rgba(245,165,36,0.2)"
            }}
          >
            <div className="absolute inset-[2px] rounded-[28px] border border-white/10 pointer-events-none" />
            <span className="text-[72px] font-extrabold text-[#F5A524] drop-shadow-[0_0_25px_rgba(245,165,36,1)] tracking-tighter">M</span>
          </div>
        </div>

        {/* Orbital Rings Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none perspective-[1000px]">
          <div className="absolute w-[360px] h-[360px] rounded-full border border-[#F5A524]/20 transform rotate-x-[65deg] rotate-y-[15deg] rotate-z-[-10deg] animate-[spin_40s_linear_infinite]" />
          <div className="absolute w-[500px] h-[500px] rounded-full border border-dashed border-[#F5A524]/30 transform rotate-x-[65deg] rotate-y-[-5deg] rotate-z-[20deg] animate-[spin_60s_linear_infinite_reverse]">
            <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_15px_3px_#F5A524]" />
            <div className="absolute bottom-0 right-1/4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_15px_3px_#F5A524]" />
          </div>
          <div className="absolute w-[680px] h-[680px] rounded-full border border-[#F5A524]/15 transform rotate-x-[65deg] rotate-y-[25deg] rotate-z-[-30deg] animate-[spin_80s_linear_infinite]">
            <div className="absolute top-1/4 right-0 w-2 h-2 bg-white rounded-full shadow-[0_0_20px_4px_#F5A524]" />
            <div className="absolute bottom-1/4 left-0 w-2 h-2 bg-white rounded-full shadow-[0_0_20px_4px_#F5A524]" />
          </div>
        </div>

        {/* Floating Nodes - Double Wrapper Architecture */}
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          
          {/* Node 1: Clarify (Top Right) */}
          <div className="absolute" style={{ transform: "translate(180px, -160px)" }}>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 animate-[sf-float-gentle_6s_ease-in-out_infinite] transition-transform hover:-translate-y-1">
              <div className="relative group">
                <div className="absolute -inset-2 bg-[#4ade80]/10 blur-xl rounded-full opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-center gap-4 p-3 pr-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-black/60 backdrop-blur-xl border border-white/[0.05] shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#4ade80]/30 to-transparent" />
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-[#4ade80]/10 flex items-center justify-center text-[#4ade80] border border-[#4ade80]/20 shadow-[0_0_15px_rgba(74,222,128,0.15)]">
                    <MessageSquare className="w-5 h-5" fill="currentColor" />
                  </div>
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-[13px] font-bold text-white leading-tight mb-0.5">1 Clarify</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Understands the request<br/>and asks the right questions.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Node 2: Plan (Middle Right) */}
          <div className="absolute" style={{ transform: "translate(250px, -20px)" }}>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 animate-[sf-float-gentle_8s_ease-in-out_infinite] transition-transform hover:-translate-y-1">
              <div className="relative group">
                <div className="relative flex items-center gap-4 p-3 pr-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-black/60 backdrop-blur-xl border border-white/[0.05] shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#c084fc]/30 to-transparent" />
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-[#c084fc]/10 flex items-center justify-center text-[#c084fc] border border-[#c084fc]/20 shadow-[0_0_15px_rgba(192,132,252,0.15)]">
                    <ListTodo className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-[13px] font-bold text-white leading-tight mb-0.5">2 Plan</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Creates PRD and breaks it<br/>down into actionable tasks.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Node 3: Build (Bottom Right) */}
          <div className="absolute" style={{ transform: "translate(180px, 150px)" }}>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 animate-[sf-float-gentle_7s_ease-in-out_infinite] transition-transform hover:-translate-y-1">
              <div className="relative group">
                <div className="relative flex items-center gap-4 p-3 pr-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-black/60 backdrop-blur-xl border border-white/[0.05] shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#60a5fa]/30 to-transparent" />
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-[#60a5fa]/10 flex items-center justify-center text-[#60a5fa] border border-[#60a5fa]/20 font-mono text-sm font-bold shadow-[0_0_15px_rgba(96,165,250,0.15)]">
                    &lt;/&gt;
                  </div>
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-[13px] font-bold text-white leading-tight mb-0.5">3 Build</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Executes tasks and<br/>opens pull requests.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Node 4: Review (Bottom Left) */}
          <div className="absolute" style={{ transform: "translate(-200px, 150px)" }}>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 animate-[sf-float-gentle_9s_ease-in-out_infinite] transition-transform hover:-translate-y-1">
              <div className="relative group">
                <div className="relative flex items-center gap-4 p-3 pr-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-black/60 backdrop-blur-xl border border-white/[0.05] shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#fb923c]/30 to-transparent" />
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-[#fb923c]/10 flex items-center justify-center text-[#fb923c] border border-[#fb923c]/20 shadow-[0_0_15px_rgba(251,146,60,0.15)]">
                    <ShieldCheck className="w-5 h-5" fill="currentColor" />
                  </div>
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-[13px] font-bold text-white leading-tight mb-0.5">4 Review</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Reviews every PR against<br/>the spec and best practices.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Node 5: Release (Top Left) */}
          <div className="absolute" style={{ transform: "translate(-240px, -150px)" }}>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 animate-[sf-float-gentle_10s_ease-in-out_infinite] transition-transform hover:-translate-y-1">
              <div className="relative group">
                <div className="relative flex items-center gap-4 p-3 pr-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-black/60 backdrop-blur-xl border border-white/[0.05] shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#ec4899]/30 to-transparent" />
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-[#ec4899]/10 flex items-center justify-center text-[#ec4899] border border-[#ec4899]/20 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                    <Rocket className="w-5 h-5" fill="currentColor" />
                  </div>
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-[13px] font-bold text-white leading-tight mb-0.5">5 Release</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Gates the release and<br/>ships with confidence.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Autopilot Badge */}
          <div className="absolute" style={{ transform: "translate(0px, 230px)" }}>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 px-5 py-2.5 rounded-full bg-black/80 border border-white/10 shadow-2xl backdrop-blur-xl animate-[sf-float-gentle_8s_ease-in-out_infinite] whitespace-nowrap">
              <span className="text-[12px] text-muted-foreground font-medium relative z-10">
                The whole loop. <span className="text-[#F5A524] font-bold">On autopilot.</span>
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
