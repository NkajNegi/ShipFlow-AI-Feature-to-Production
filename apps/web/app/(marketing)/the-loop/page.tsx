import { MarketingHeader } from "@/components/marketing-header";
import Link from "next/link";

const ACCENT = "var(--primary)";

export default function TheLoopPage() {
  const steps = [
    { title: "1. Feature Request", desc: "A stakeholder submits an idea." },
    { title: "2. AI Generates PRD", desc: "The PM agent expands it into a strict specification." },
    { title: "3. Task Breakdown", desc: "The agent splits the PRD into Kanban tickets." },
    { title: "4. Code & Commit", desc: "Engineers push code referencing the tickets." },
    { title: "5. AI QA Review", desc: "The QA agent checks the PR against the PRD." },
    { title: "6. Human Approval", desc: "A Tech Lead gives the final green light to ship." }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-foreground font-sans">
      <MarketingHeader />
      
      <section className="relative z-10 mx-auto max-w-4xl px-7 pt-24 text-center">
        <h1 className="text-[clamp(40px,8vw,64px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
          The <span className="sf-shine-text">Loop</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[600px] text-[18.5px] leading-relaxed text-muted-foreground">
          A continuous, fully-automated cycle from idea to production. 
        </p>
      </section>

      <section className="relative z-10 mx-auto mt-20 max-w-[800px] px-7 pb-32">
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-6 items-center p-6 rounded-2xl border border-white/5 bg-[#0c0c0c]/50 glass spotlight-card">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg font-bold" style={{ color: ACCENT }}>
                {i + 1}
              </div>
              <div>
                <h3 className="text-xl font-bold">{step.title.substring(3)}</h3>
                <p className="text-muted-foreground mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
