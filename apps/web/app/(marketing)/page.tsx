import { MarketingHeader } from "@/components/marketing-header";
import { CoreLoop } from "@/components/core-loop";
import { HeroOrbitalGraphic } from "@/components/hero-orbital-graphic";
import Link from "next/link";
import { Zap, CheckSquare, ShieldCheck, BarChart, Users } from "lucide-react";

/* MetroFlow landing — ported from the UIUX design (gold accent on dark).
   Accent maps to the theme's --primary (oklch(0.82 0.14 85)). */
const ACCENT = "var(--primary)";
const ACCENT_SOFT = "oklch(0.82 0.14 85 / 0.14)";
const ACCENT_LINE = "oklch(0.82 0.14 85 / 0.38)";
const ACCENT_GLOW = "oklch(0.82 0.14 85 / 0.22)";

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      {/* background: grid + glows */}
      <div
        className="sf-grid pointer-events-none absolute inset-0"
        style={{
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[760px]"
        style={{
          background: `radial-gradient(ellipse 60% 60% at 50% -8%, ${ACCENT_GLOW}, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute h-[480px] w-[480px] rounded-full blur-[30px]"
        style={{
          top: -120,
          left: -80,
          background: `radial-gradient(circle, ${ACCENT_GLOW}, transparent 68%)`,
          animation: "sf-float1 16s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute h-[520px] w-[520px] rounded-full blur-[34px]"
        style={{
          top: 240,
          right: -120,
          background:
            "radial-gradient(circle, oklch(0.6 0.16 250 / 0.18), transparent 68%)",
          animation: "sf-float2 20s ease-in-out infinite",
        }}
      />

      {/* header */}
      <MarketingHeader />

      {/* hero + showcase */}
      <section className="relative z-[2] mx-auto mt-20 grid max-w-[1200px] grid-cols-1 items-center gap-10 px-4 sm:px-7 lg:grid-cols-2">
        <div className="text-left">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
            style={{ border: `1px solid ${ACCENT_LINE}`, background: ACCENT_SOFT, color: "#fff" }}
          >
            <span style={{ color: "#F5A524" }}>✨</span>
            Idea → Production, on autopilot
          </div>
          <h1 className="mt-6 max-w-[580px] text-[clamp(40px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.035em] text-balance">
            Your AI operator for
            <br />
            software <span className="sf-shine-text">delivery</span>
          </h1>
          <p className="mt-5 max-w-[500px] text-[18.5px] leading-relaxed text-muted-foreground text-pretty">
            MetroFlow runs the whole loop — clarifies the request, writes the PRD,
            plans the tasks, reviews every pull request against the spec, and gates
            the release on a human.
            <br /><br />
            <span style={{ color: "#F5A524" }}>Not a code generator. An operator.</span>
          </p>
          
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-full px-7 py-3.5 text-[15.5px] font-bold transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,165,36,0.4)]"
              style={{ background: "#FFC250", color: "#111" }}
            >
              Start building free →
            </Link>
            <a
              href="#loop"
              className="flex items-center gap-2 rounded-full px-6 py-3.5 text-[15.5px] font-semibold transition-colors"
              style={{
                background: "rgba(255,255,255,0.03)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
              See the workflow
            </a>
          </div>

          <div className="mt-8 flex gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><span className="text-emerald-400">✓</span> No credit card</span>
            <span className="flex items-center gap-2"><span className="text-purple-400">✓</span> Setup in 2 minutes</span>
            <span className="flex items-center gap-2"><span className="text-yellow-400">✓</span> Cancel anytime</span>
          </div>
        </div>

        <div className="relative hidden lg:block h-full min-h-[600px] w-full pl-8">
          <HeroOrbitalGraphic />
        </div>

      </section>


      {/* bottom features */}
      <section className="relative z-[2] mx-auto mt-20 max-w-[1200px] px-7 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Card 1 */}
          <div className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent p-6 border border-white/[0.05] hover:border-white/[0.08] transition-colors">
            <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
              <Zap className="h-5 w-5" fill="currentColor" />
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              <h3 className="text-[14px] font-semibold text-white">End-to-end automation</h3>
              <p className="text-[13px] leading-[1.6] text-muted-foreground/80">From idea to production with human-in-the-loop safety.</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent p-6 border border-white/[0.05] hover:border-white/[0.08] transition-colors">
            <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <CheckSquare className="h-5 w-5" fill="currentColor" />
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              <h3 className="text-[14px] font-semibold text-white">Spec-driven delivery</h3>
              <p className="text-[13px] leading-[1.6] text-muted-foreground/80">Every PR is checked against the spec, not assumptions.</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent p-6 border border-white/[0.05] hover:border-white/[0.08] transition-colors">
            <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <ShieldCheck className="h-5 w-5" fill="currentColor" />
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              <h3 className="text-[14px] font-semibold text-white">Built-in quality gates</h3>
              <p className="text-[13px] leading-[1.6] text-muted-foreground/80">Automated reviews, tests, security scans, and performance checks.</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent p-6 border border-white/[0.05] hover:border-white/[0.08] transition-colors">
            <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <BarChart className="h-5 w-5" fill="currentColor" />
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              <h3 className="text-[14px] font-semibold text-white">Observability first</h3>
              <p className="text-[13px] leading-[1.6] text-muted-foreground/80">Real-time insights with built-in dashboards and alerts.</p>
            </div>
          </div>

          {/* Card 5 */}
          <div className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent p-6 border border-white/[0.05] hover:border-white/[0.08] transition-colors">
            <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.15)]">
              <Users className="h-5 w-5" fill="currentColor" />
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              <h3 className="text-[14px] font-semibold text-white">Collaborate with confidence</h3>
              <p className="text-[13px] leading-[1.6] text-muted-foreground/80">Clear handoffs, audit trails, and instant context for your team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Loop Redesign */}
      <CoreLoop />

      {/* final CTA */}
      <section className="relative z-[2] mx-auto mt-20 max-w-[760px] px-7 pb-[90px] text-center">
        <h2 className="text-[38px] font-extrabold tracking-[-0.03em]">Ship with confidence.</h2>
        <p className="mt-2.5 text-base text-muted-foreground">
          Free to start. Connect a repo and watch the loop run.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-[11px] px-[26px] py-3.5 text-[15.5px] font-bold transition-opacity hover:opacity-90"
          style={{ background: ACCENT, color: "oklch(0.13 0 0)" }}
        >
          Open the app →
        </Link>
        <div
          className="mt-[60px] border-t pt-6 text-[13px] text-muted-foreground/70"
          style={{ borderColor: "oklch(1 0 0 / 0.07)" }}
        >
          MetroFlow AI — Your AI operator for software delivery · Builder Mode On
        </div>
      </section>
    </div>
  );
}
