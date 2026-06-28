"use client";

import React from "react";
import { MessageSquare, ListTodo, Code, ShieldCheck, Rocket } from "lucide-react";

export function HeroOrbitalGraphic() {
  return (
    <div className="relative w-full h-full min-h-[500px] flex items-center justify-center pt-10 select-none">
      
      {/* Central Glowing S */}
      <div className="relative z-20 w-[140px] h-[140px] flex items-center justify-center">
        {/* Background ambient glow */}
        <div className="absolute inset-0 bg-[#F5A524]/20 blur-[60px] rounded-full scale-150 pointer-events-none" />
        
        {/* Box itself */}
        <div 
          className="relative w-full h-full rounded-[30px] flex items-center justify-center shadow-[0_0_80px_rgba(245,165,36,0.3)] animate-[sf-float1_10s_ease-in-out_infinite]"
          style={{
            background: "linear-gradient(135deg, #2a1600 0%, #0c0800 100%)",
            border: "1px solid rgba(245,165,36,0.4)",
            boxShadow: "inset 0 2px 10px rgba(245,165,36,0.4), 0 10px 40px rgba(0,0,0,0.8), 0 0 80px rgba(245,165,36,0.2)"
          }}
        >
          {/* Inner ring highlight */}
          <div className="absolute inset-[2px] rounded-[28px] border border-white/5 pointer-events-none" />
          
          <span className="text-[72px] font-extrabold text-[#F5A524] drop-shadow-[0_0_15px_rgba(245,165,36,0.8)] tracking-tighter">S</span>
        </div>
      </div>

      {/* Orbital Rings Background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none perspective-[1000px]">
        {/* Ring 1 (Inner, tilted right) */}
        <div className="absolute w-[360px] h-[360px] rounded-full border border-white/[0.08] transform rotate-x-[65deg] rotate-y-[15deg] rotate-z-[-10deg] animate-[spin_40s_linear_infinite]" />
        
        {/* Ring 2 (Middle, horizontal) */}
        <div className="absolute w-[500px] h-[500px] rounded-full border border-dashed border-white/[0.15] transform rotate-x-[65deg] rotate-y-[-5deg] rotate-z-[20deg] animate-[spin_60s_linear_infinite_reverse]">
          <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-[#4ade80] rounded-full shadow-[0_0_10px_#4ade80]" />
          <div className="absolute bottom-0 right-1/4 w-1.5 h-1.5 bg-[#fb923c] rounded-full shadow-[0_0_10px_#fb923c]" />
        </div>
        
        {/* Ring 3 (Outer, tilted left) */}
        <div className="absolute w-[680px] h-[680px] rounded-full border border-white/[0.08] transform rotate-x-[65deg] rotate-y-[25deg] rotate-z-[-30deg] animate-[spin_80s_linear_infinite]">
          <div className="absolute top-1/4 right-0 w-2 h-2 bg-[#c084fc] rounded-full shadow-[0_0_15px_#c084fc]" />
          <div className="absolute bottom-1/4 left-0 w-2 h-2 bg-[#60a5fa] rounded-full shadow-[0_0_15px_#60a5fa]" />
        </div>
      </div>

      {/* Floating Nodes */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        
        {/* Node 1: Clarify (Top Right) */}
        <div className="absolute top-[5%] right-[10%] animate-[sf-float2_12s_ease-in-out_infinite]">
          <div className="relative group">
            <div className="absolute -inset-2 bg-[#4ade80]/20 blur-xl rounded-full opacity-0 transition-opacity" />
            <div className="relative flex items-center gap-4 p-3 pr-5 bg-[#0a0a0c]/90 backdrop-blur-md border border-[#4ade80]/30 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="w-10 h-10 rounded-xl bg-[#4ade80]/10 flex items-center justify-center text-[#4ade80] border border-[#4ade80]/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-white leading-tight mb-0.5">1 Clarify</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Understands the request<br/>and asks the right questions.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Node 2: Plan (Middle Right) */}
        <div className="absolute top-[32%] right-[-5%] animate-[sf-float1_15s_ease-in-out_infinite_reverse]">
          <div className="relative group">
            <div className="relative flex items-center gap-4 p-3 pr-5 bg-[#0a0a0c]/90 backdrop-blur-md border border-[#c084fc]/30 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="w-10 h-10 rounded-xl bg-[#c084fc]/10 flex items-center justify-center text-[#c084fc] border border-[#c084fc]/20">
                <ListTodo className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-white leading-tight mb-0.5">2 Plan</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Creates PRD and breaks it<br/>down into actionable tasks.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Node 3: Build (Bottom Right) */}
        <div className="absolute top-[65%] right-[2%] animate-[sf-float2_14s_ease-in-out_infinite]">
          <div className="relative group">
            <div className="relative flex items-center gap-4 p-3 pr-5 bg-[#0a0a0c]/90 backdrop-blur-md border border-[#60a5fa]/30 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="w-10 h-10 rounded-xl bg-[#60a5fa]/10 flex items-center justify-center text-[#60a5fa] border border-[#60a5fa]/20 font-mono text-sm font-bold">
                &lt;/&gt;
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-white leading-tight mb-0.5">3 Build</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Executes tasks and<br/>opens pull requests.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Node 4: Review (Bottom Center) */}
        <div className="absolute bottom-[8%] left-[20%] animate-[sf-float1_16s_ease-in-out_infinite_reverse]">
          <div className="relative group flex flex-col items-center">
            <div className="relative flex items-center gap-4 p-3 pr-5 bg-[#0a0a0c]/90 backdrop-blur-md border border-[#facc15]/30 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#facc15]/10 flex items-center justify-center text-[#facc15] border border-[#facc15]/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-white leading-tight mb-0.5">4 Review</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Reviews every PR against<br/>the spec and best practices.</span>
              </div>
            </div>
            
            {/* Autopilot Badge */}
            <div className="px-5 py-2.5 rounded-xl bg-[#0a0a0c]/95 border border-white/10 shadow-2xl backdrop-blur-xl relative ml-32">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#F5A524]/5 rounded-xl" />
               <span className="text-[13px] text-muted-foreground font-medium relative z-10">The whole loop. <span className="text-[#F5A524] font-bold">On autopilot.</span></span>
            </div>
          </div>
        </div>

        {/* Node 5: Release (Left Middle) */}
        <div className="absolute top-[45%] left-[-2%] animate-[sf-float2_18s_ease-in-out_infinite]">
          <div className="relative group">
            <div className="relative flex items-center gap-4 p-3 pr-5 bg-[#0a0a0c]/90 backdrop-blur-md border border-[#ec4899]/30 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="w-10 h-10 rounded-xl bg-[#ec4899]/10 flex items-center justify-center text-[#ec4899] border border-[#ec4899]/20">
                <Rocket className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-white leading-tight mb-0.5">5 Release</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Gates the release and<br/>ships with confidence.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
