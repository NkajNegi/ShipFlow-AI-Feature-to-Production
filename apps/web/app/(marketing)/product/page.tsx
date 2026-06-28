import { MarketingHeader } from "@/components/marketing-header";
import Link from "next/link";

const ACCENT = "var(--primary)";

export default function ProductPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-foreground font-sans">
      <MarketingHeader />
      
      <section className="relative z-10 mx-auto max-w-4xl px-7 pt-24 text-center">
        <h1 className="text-[clamp(40px,8vw,64px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
          Product <span className="sf-shine-text">Features</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[600px] text-[18.5px] leading-relaxed text-muted-foreground">
          ShipFlow AI replaces fragmented tools with a single, intelligent operator that manages the entire software lifecycle.
        </p>
      </section>

      <section className="relative z-10 mx-auto mt-20 grid max-w-[1000px] grid-cols-1 md:grid-cols-2 gap-6 px-7 pb-32">
        <div className="p-8 rounded-3xl border border-white/10 bg-[#0c0c0c] glass spotlight-card">
          <h3 className="text-xl font-bold mb-3">AI Product Manager</h3>
          <p className="text-muted-foreground leading-relaxed">
            Drop in a one-sentence feature request. ShipFlow generates a comprehensive PRD with acceptance criteria, edge cases, and success metrics.
          </p>
        </div>
        <div className="p-8 rounded-3xl border border-white/10 bg-[#0c0c0c] glass spotlight-card">
          <h3 className="text-xl font-bold mb-3">Smart Task Planning</h3>
          <p className="text-muted-foreground leading-relaxed">
            The PRD is automatically broken down into actionable engineering tasks, synced directly to the built-in Kanban board and assigned to developers.
          </p>
        </div>
        <div className="p-8 rounded-3xl border border-white/10 bg-[#0c0c0c] glass spotlight-card">
          <h3 className="text-xl font-bold mb-3">Autonomous QA Reviewer</h3>
          <p className="text-muted-foreground leading-relaxed">
            Every PR is reviewed against the original PRD. The AI catches logic flaws, missing acceptance criteria, and blocks shipping if requirements aren't met.
          </p>
        </div>
        <div className="p-8 rounded-3xl border border-white/10 bg-[#0c0c0c] glass spotlight-card">
          <h3 className="text-xl font-bold mb-3">Security & Performance</h3>
          <p className="text-muted-foreground leading-relaxed">
            Out-of-the-box checks for OWASP Top 10 vulnerabilities, N+1 query detection, and performance anti-patterns before they hit production.
          </p>
        </div>
      </section>
    </div>
  );
}
