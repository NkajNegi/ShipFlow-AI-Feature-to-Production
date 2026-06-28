import { MarketingHeader } from "@/components/marketing-header";
import Link from "next/link";

/* ShipFlow landing — ported from the UIUX design (gold accent on dark).
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
      <section className="relative z-[2] mx-auto mt-20 grid max-w-[1200px] grid-cols-1 items-center gap-10 px-7 lg:grid-cols-2">
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
            ShipFlow runs the whole loop — clarifies the request, writes the PRD,
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

      </section>

      {/* trusted by */}
      <section className="relative z-[2] mx-auto mt-24 max-w-[1000px] px-7 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-8">
          Trusted by engineering teams
        </div>
        <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 font-bold text-lg"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> GitHub</div>
          <div className="flex items-center gap-2 font-bold text-lg">aws</div>
          <div className="flex items-center gap-2 font-bold text-lg">docker</div>
          <div className="flex items-center gap-2 font-bold text-lg">kubernetes</div>
          <div className="flex items-center gap-2 font-bold text-lg">Jenkins</div>
          <div className="flex items-center gap-2 font-bold text-lg">Terraform</div>
          <div className="flex items-center gap-2 font-bold text-lg">prometheus</div>
          <div className="flex items-center gap-2 font-bold text-lg">Grafana</div>
        </div>
      </section>



      {/* bottom features */}
      <section className="relative z-[2] mx-auto mt-20 max-w-[1200px] px-7 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-[#0c0c0c]/80 border border-white/5 shadow-xl glass spotlight-card flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">⚡</div>
            <div>
              <h3 className="text-[13px] font-bold text-white">End-to-end automation</h3>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug">From idea to production with human-in-the-loop safety.</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-[#0c0c0c]/80 border border-white/5 shadow-xl glass spotlight-card flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">✅</div>
            <div>
              <h3 className="text-[13px] font-bold text-white">Spec-driven delivery</h3>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug">Every PR is checked against the spec, not assumptions.</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-[#0c0c0c]/80 border border-white/5 shadow-xl glass spotlight-card flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">🛡️</div>
            <div>
              <h3 className="text-[13px] font-bold text-white">Built-in quality gates</h3>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug">Automated reviews, tests, security scans, and performance checks.</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-[#0c0c0c]/80 border border-white/5 shadow-xl glass spotlight-card flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">📊</div>
            <div>
              <h3 className="text-[13px] font-bold text-white">Observability first</h3>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug">Real-time insights with built-in dashboards and alerts.</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-[#0c0c0c]/80 border border-white/5 shadow-xl glass spotlight-card flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">👥</div>
            <div>
              <h3 className="text-[13px] font-bold text-white">Collaborate with confidence</h3>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug">Clear handoffs, audit trails, and instant context for your team.</p>
            </div>
          </div>
        </div>
      </section>

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
          ShipFlow AI — Your AI operator for software delivery · Builder Mode On
        </div>
      </section>
    </div>
  );
}

function OrbitGraphic() {
  return (
    <div className="relative mx-auto flex h-[500px] w-[500px] items-center justify-center">
      {/* Background glow flares */}
      <div className="absolute inset-0 rounded-full blur-[60px]" style={{ background: "radial-gradient(circle, rgba(245,165,36,0.15) 0%, transparent 60%)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full blur-[80px]" style={{ background: "radial-gradient(ellipse, rgba(157,80,187,0.15) 0%, transparent 60%)" }} />
      
      {/* Orbit Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5 opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[250px] rounded-full border border-white/10 opacity-40 rotate-12" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] rounded-full border border-[#9D50BB]/30 opacity-30 -rotate-12" />

      {/* Center S Hub */}
      <div
        className="relative flex h-[100px] w-[100px] items-center justify-center rounded-[28px] z-10"
        style={{
          background: "linear-gradient(135deg, #FFC250, #E09000)",
          boxShadow: "0 0 60px rgba(245,165,36,0.5), inset 0 2px 5px rgba(255,255,255,0.5)",
        }}
      >
        <span className="text-[50px] font-extrabold text-black/90">S</span>
      </div>

      {/* Floating Nodes */}
      {/* Node 1: Clarify */}
      <div className="absolute top-[5%] right-[15%] w-[200px] p-3 rounded-2xl bg-[#0c0c0c]/80 backdrop-blur-xl border-t-2 border-t-green-500 border-x border-b border-white/10 shadow-2xl z-20">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 shrink-0 rounded-md bg-green-500/20 text-green-500 flex items-center justify-center text-xs">💬</div>
          <div>
            <div className="text-[11px] font-bold text-white">1 Clarify</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Understands the request and asks the right questions.</div>
          </div>
        </div>
      </div>

      {/* Node 2: Plan */}
      <div className="absolute top-[25%] -right-[20%] w-[180px] p-3 rounded-2xl bg-[#0c0c0c]/80 backdrop-blur-xl border-t-2 border-t-purple-500 border-x border-b border-white/10 shadow-2xl z-20">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 shrink-0 rounded-md bg-purple-500/20 text-purple-500 flex items-center justify-center text-xs">📋</div>
          <div>
            <div className="text-[11px] font-bold text-white">2 Plan</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Creates PRD and breaks it down into tasks.</div>
          </div>
        </div>
      </div>

      {/* Node 3: Build */}
      <div className="absolute bottom-[40%] -right-[15%] w-[180px] p-3 rounded-2xl bg-[#0c0c0c]/80 backdrop-blur-xl border-t-2 border-t-blue-500 border-x border-b border-white/10 shadow-2xl z-20">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 shrink-0 rounded-md bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs">&lt;/&gt;</div>
          <div>
            <div className="text-[11px] font-bold text-white">3 Build</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Executes tasks and opens pull requests.</div>
          </div>
        </div>
      </div>

      {/* Node 4: Review */}
      <div className="absolute bottom-[10%] left-[15%] w-[190px] p-3 rounded-2xl bg-[#0c0c0c]/80 backdrop-blur-xl border-t-2 border-t-yellow-500 border-x border-b border-white/10 shadow-2xl z-20">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 shrink-0 rounded-md bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs">🛡️</div>
          <div>
            <div className="text-[11px] font-bold text-white">4 Review</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Reviews every PR against the spec.</div>
          </div>
        </div>
      </div>

      {/* Node 5: Release */}
      <div className="absolute top-[35%] -left-[15%] w-[170px] p-3 rounded-2xl bg-[#0c0c0c]/80 backdrop-blur-xl border-t-2 border-t-pink-500 border-x border-b border-white/10 shadow-2xl z-20">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 shrink-0 rounded-md bg-pink-500/20 text-pink-500 flex items-center justify-center text-xs">🚀</div>
          <div>
            <div className="text-[11px] font-bold text-white">5 Release</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Gates the release and ships.</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 text-[11px] text-muted-foreground font-mono">
        The whole loop. <span className="text-[#FFC250]">On autopilot.</span>
      </div>
    </div>
  );
}
