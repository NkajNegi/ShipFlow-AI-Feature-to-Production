import React from "react";

type ColorKey = "purple" | "blue" | "pink" | "orange" | "yellow" | "green";

const flowSteps: Array<{ id: number; label: string; icon: string; color: ColorKey }> = [
  { id: 1, label: "Request", icon: "💬", color: "purple" },
  { id: 2, label: "PRD", icon: "📋", color: "purple" },
  { id: 3, label: "Tasks", icon: "📝", color: "blue" },
  { id: 4, label: "Code", icon: "</>", color: "blue" },
  { id: 5, label: "AI Review", icon: "✨", color: "pink" },
  { id: 6, label: "Fixes", icon: "🔧", color: "orange" },
  { id: 7, label: "Approval", icon: "🛡️", color: "yellow" },
  { id: 8, label: "Ship", icon: "🚀", color: "green" },
];

const colorMap: Record<ColorKey, { bg: string; border: string; text: string; glow: string }> = {
  purple: { bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.5)", text: "#c084fc", glow: "rgba(168,85,247,0.4)" },
  blue: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.5)", text: "#60a5fa", glow: "rgba(59,130,246,0.4)" },
  pink: { bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.5)", text: "#f472b6", glow: "rgba(236,72,153,0.4)" },
  orange: { bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.5)", text: "#fb923c", glow: "rgba(249,115,22,0.4)" },
  yellow: { bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.5)", text: "#facc15", glow: "rgba(234,179,8,0.4)" },
  green: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.5)", text: "#4ade80", glow: "rgba(34,197,94,0.4)" },
};

export function CoreLoop() {
  return (
    <div className="relative z-10 w-full max-w-[1100px] mx-auto mt-32 px-4">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c084fc] mb-4">
          The Core Loop
        </div>
        <h2 className="text-[40px] md:text-[50px] font-extrabold tracking-tight text-white leading-tight">
          Ship better software, <span className="bg-gradient-to-r from-[#c084fc] to-[#facc15] bg-clip-text text-transparent">every time.</span>
        </h2>
        <p className="text-muted-foreground mt-4 text-[17px]">
          MetroFlow AI runs the entire software delivery process — end to end.
        </p>
      </div>

      {/* Flowchart */}
      <div className="relative flex justify-between items-center mb-16 overflow-x-auto pb-6 scrollbar-hide w-full max-w-full">
        <div className="flex items-center min-w-[900px] w-full justify-between px-2">
          {flowSteps.map((step, index) => {
            const styles = colorMap[step.color];
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-3 relative group">
                  <div 
                    className="w-[60px] h-[60px] rounded-[16px] flex items-center justify-center text-xl relative z-10 transition-all duration-300 group-hover:-translate-y-1"
                    style={{
                      background: "linear-gradient(180deg, #111 0%, #000 100%)",
                      border: `1px solid ${styles.border}`,
                      boxShadow: `0 4px 20px -5px ${styles.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                      color: styles.text
                    }}
                  >
                    {step.icon}
                  </div>
                  <span className="text-[12px] font-semibold text-white/80">{step.label}</span>
                </div>
                {index < flowSteps.length - 1 && (
                  <div className="flex-1 flex items-center relative mx-2 h-[2px]">
                    {/* Connecting line */}
                    <div className="w-full border-t border-dashed border-white/20"></div>
                    {/* Glowing particle */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: colorMap[flowSteps[index+1]!.color].text, boxShadow: `0 0 10px 2px ${colorMap[flowSteps[index+1]!.color].glow}` }}></div>
                    {index === 0 && (
                       <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40 text-xs bg-[#000] px-1">&gt;</div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Card 1 */}
        <div className="relative overflow-hidden rounded-[20px] p-8 border border-white/10 bg-[#0a0a0c] shadow-2xl flex items-center gap-6 group hover:border-[#c084fc]/50 transition-colors">
          <div className="absolute top-0 left-0 w-[300px] h-[200px] bg-[#c084fc]/10 blur-[60px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="w-[120px] h-[120px] shrink-0 relative flex items-center justify-center">
            {/* Magnifying Glass UI simulation */}
            <div className="absolute inset-0 rounded-full border-[6px] border-[#c084fc]/40" />
            <div className="absolute w-[80%] h-[80%] rounded-full border-[2px] border-[#c084fc] shadow-[0_0_30px_#c084fc]" />
            <div className="absolute bottom-[-10px] right-[-10px] w-[50px] h-[14px] bg-gradient-to-br from-white/40 to-white/10 rounded-full rotate-45 backdrop-blur-md border border-white/20" />
            <span className="text-[#c084fc] absolute text-2xl -top-2 -left-2">✨</span>
          </div>
          <div className="relative z-10 flex-1">
            <div className="inline-block px-3 py-1 rounded-md text-[10px] font-bold tracking-widest text-[#c084fc] bg-[#c084fc]/10 mb-3 border border-[#c084fc]/20">PHASE 1 - 2</div>
            <h3 className="text-[22px] font-bold text-white mb-2">Discovery → PRD</h3>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">An AI PM clarifies the request, checks for duplicates, then writes a strict PRD: problem, goals, user stories, acceptance criteria, edge cases and success metrics.</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-white/10 group-hover:text-white transition-colors shrink-0">→</div>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-hidden rounded-[20px] p-8 border border-white/10 bg-[#0a0a0c] shadow-2xl flex items-center gap-6 group hover:border-[#c084fc]/50 transition-colors">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#c084fc]/10 blur-[60px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="w-[120px] h-[120px] shrink-0 relative flex items-center justify-center -rotate-12">
            {/* Kanban UI simulation */}
            <div className="w-full h-full border border-[#c084fc]/30 rounded-xl bg-black/40 backdrop-blur-sm p-3 flex gap-2">
              <div className="flex-1 flex flex-col gap-2"><div className="h-6 w-full rounded bg-[#c084fc]/20"/><div className="h-6 w-full rounded bg-[#c084fc]/40"/><div className="h-6 w-full rounded bg-white/5"/></div>
              <div className="flex-1 flex flex-col gap-2"><div className="h-6 w-full rounded bg-white/5"/><div className="h-6 w-full rounded bg-[#c084fc]/30"/></div>
              <div className="flex-1 flex flex-col gap-2"><div className="h-6 w-full rounded bg-[#c084fc]/50"/><div className="h-6 w-full rounded bg-white/5"/></div>
            </div>
          </div>
          <div className="relative z-10 flex-1">
            <div className="inline-block px-3 py-1 rounded-md text-[10px] font-bold tracking-widest text-[#c084fc] bg-[#c084fc]/10 mb-3 border border-[#c084fc]/20">PHASE 2</div>
            <h3 className="text-[22px] font-bold text-white mb-2">Planning</h3>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">The PRD becomes engineering tasks on a drag-and-drop Kanban board your team approves.</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-white/10 group-hover:text-white transition-colors shrink-0">→</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Card 3 */}
        <div className="relative overflow-hidden rounded-[20px] p-6 border border-white/10 bg-[#0a0a0c] shadow-2xl flex flex-col gap-4 group hover:border-[#60a5fa]/50 transition-colors">
          <div className="absolute top-0 left-0 w-[150px] h-[150px] bg-[#60a5fa]/15 blur-[50px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="flex justify-between items-start">
             <div className="w-[80px] h-[80px] relative -rotate-6">
                <div className="w-full h-full border border-[#60a5fa]/40 rounded-xl bg-black/60 shadow-[0_0_20px_rgba(96,165,250,0.3)] p-2 flex flex-col justify-between">
                  <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/><div className="w-2 h-2 rounded-full bg-yellow-500/50"/><div className="w-2 h-2 rounded-full bg-green-500/50"/></div>
                  <div className="text-[#60a5fa] font-mono text-xs flex justify-center items-center h-full">&lt;/&gt;</div>
                </div>
             </div>
             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-white/10 group-hover:text-white transition-colors">→</div>
          </div>
          <div className="relative z-10 mt-2">
            <div className="inline-block px-3 py-1 rounded-md text-[10px] font-bold tracking-widest text-[#60a5fa] bg-[#60a5fa]/10 mb-3 border border-[#60a5fa]/20">PHASE 3</div>
            <h3 className="text-[20px] font-bold text-white mb-2">Development</h3>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">Connect GitHub. Reference a task (Closes SF-123) in your PR and MetroFlow maps it automatically.</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="relative overflow-hidden rounded-[20px] p-6 border border-white/10 bg-[#0a0a0c] shadow-2xl flex flex-col gap-4 group hover:border-[#facc15]/50 transition-colors">
          <div className="absolute top-1/2 left-0 w-[150px] h-[150px] bg-[#facc15]/10 blur-[50px] rounded-full -translate-y-1/2 pointer-events-none" />
          <div className="flex justify-between items-start">
             <div className="w-[80px] h-[80px] relative">
                <div className="w-full h-full border border-[#facc15]/40 rounded-full bg-black/60 shadow-[0_0_20px_rgba(250,204,21,0.2)] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[#facc15] shadow-[0_0_15px_#facc15]" />
                  <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#c084fc] shadow-[0_0_10px_#c084fc]" />
                  <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[#60a5fa] shadow-[0_0_10px_#60a5fa]" />
                  <div className="absolute inset-0 rounded-full border border-dashed border-[#facc15]/30 animate-[spin_10s_linear_infinite]" />
                </div>
             </div>
             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-white/10 group-hover:text-white transition-colors">→</div>
          </div>
          <div className="relative z-10 mt-2">
            <div className="inline-block px-3 py-1 rounded-md text-[10px] font-bold tracking-widest text-[#facc15] bg-[#facc15]/10 mb-3 border border-[#facc15]/20">PHASE 4</div>
            <h3 className="text-[20px] font-bold text-white mb-2">AI Review Loop</h3>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">A QA agent reviews each PR against the PRD, acceptance criteria, security, and edge cases.</p>
          </div>
        </div>

        {/* Card 5 */}
        <div className="relative overflow-hidden rounded-[20px] p-6 border border-white/10 bg-[#0a0a0c] shadow-2xl flex flex-col gap-4 group hover:border-[#4ade80]/50 transition-colors">
          <div className="absolute bottom-0 right-0 w-[150px] h-[150px] bg-[#4ade80]/15 blur-[50px] rounded-full translate-x-1/4 translate-y-1/4 pointer-events-none" />
          <div className="flex justify-between items-start">
             <div className="w-[80px] h-[80px] relative">
                <div className="w-full h-full relative flex items-center justify-center">
                  <div className="absolute text-4xl text-white/10 left-0 top-2">👤</div>
                  <div className="absolute text-4xl text-white/10 right-0 top-2">👤</div>
                  <div className="relative z-10 text-[42px] text-[#4ade80] drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">👤</div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#4ade80] text-black flex items-center justify-center text-xs font-bold shadow-[0_0_15px_#4ade80] z-20">✓</div>
                </div>
             </div>
             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-white/10 group-hover:text-white transition-colors">→</div>
          </div>
          <div className="relative z-10 mt-2">
            <div className="inline-block px-3 py-1 rounded-md text-[10px] font-bold tracking-widest text-[#4ade80] bg-[#4ade80]/10 mb-3 border border-[#4ade80]/20">PHASE 5</div>
            <h3 className="text-[20px] font-bold text-white mb-2">Human Approval & Release</h3>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">Admins and Leads approve, and only green features ship to production safely.</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="w-full max-w-[900px] mx-auto rounded-[24px] bg-[#0c0c0e] border border-white/5 shadow-2xl p-6 md:p-8 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5">
        <div className="flex-1 flex items-center gap-5 p-4">
           <div className="w-[50px] h-[50px] rounded-[14px] bg-[#c084fc]/10 border border-[#c084fc]/20 flex items-center justify-center text-2xl text-[#c084fc] shadow-[0_0_20px_rgba(168,85,247,0.2)]">⚡</div>
           <div>
             <div className="text-[28px] font-extrabold text-[#c084fc]">9 steps</div>
             <div className="text-[13px] text-muted-foreground mt-1 leading-snug">From request to shipped,<br/>one automated loop</div>
           </div>
        </div>
        <div className="flex-1 flex items-center gap-5 p-4">
           <div className="w-[50px] h-[50px] rounded-[14px] bg-[#60a5fa]/10 border border-[#60a5fa]/20 flex items-center justify-center text-2xl text-[#60a5fa] shadow-[0_0_20px_rgba(59,130,246,0.2)]">🛡️</div>
           <div>
             <div className="text-[28px] font-extrabold text-[#60a5fa]">OWASP</div>
             <div className="text-[13px] text-muted-foreground mt-1 leading-snug">Every PR checked for the Top 10 +<br/>performance</div>
           </div>
        </div>
        <div className="flex-1 flex items-center gap-5 p-4">
           <div className="w-[50px] h-[50px] rounded-[14px] bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center text-2xl text-[#4ade80] shadow-[0_0_20px_rgba(34,197,94,0.2)]">✅</div>
           <div>
             <div className="text-[28px] font-extrabold text-[#4ade80]">100%</div>
             <div className="text-[13px] text-muted-foreground mt-1 leading-snug">Releases gated on a human<br/>reviewer</div>
           </div>
        </div>
      </div>
    </div>
  );
}
