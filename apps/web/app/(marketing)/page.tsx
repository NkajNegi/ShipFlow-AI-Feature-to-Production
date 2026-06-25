import Link from "next/link";

/* ShipFlow landing — ported from the UIUX design (gold accent on dark).
   Accent maps to the theme's --primary (oklch(0.82 0.14 85)). */
const ACCENT = "var(--primary)";
const ACCENT_SOFT = "oklch(0.82 0.14 85 / 0.14)";
const ACCENT_LINE = "oklch(0.82 0.14 85 / 0.38)";
const ACCENT_GLOW = "oklch(0.82 0.14 85 / 0.22)";

const loopChips = [
  "Request",
  "PRD",
  "Tasks",
  "Code",
  "AI Review",
  "Fixes",
  "Approval",
  "Ship",
];

const orbitIcons = ["📝", "📋", "✅", "🧩", "🔍", "🛠️", "🚀"];

const bento = [
  {
    phase: "Phase 1 · 2",
    title: "Discovery → PRD",
    desc: "An AI PM clarifies the request, checks for duplicates, then writes a strict PRD: problem, goals, user stories, acceptance criteria, edge cases and success metrics.",
    span: "span 2",
  },
  {
    phase: "Phase 2",
    title: "Planning",
    desc: "The PRD becomes engineering tasks on a drag-and-drop Kanban board your team approves.",
    span: "span 1",
  },
  {
    phase: "Phase 3",
    title: "Development",
    desc: "Connect GitHub. Reference a task (Closes SF-123) in your PR and ShipFlow maps it automatically.",
    span: "span 1",
  },
  {
    phase: "Phase 4",
    title: "AI Review Loop",
    desc: "A QA agent reviews each PR against the PRD, acceptance criteria, security (OWASP Top 10), performance and edge cases — flagging issues as blocking or non-blocking.",
    span: "span 2",
  },
  {
    phase: "Phase 5",
    title: "Human Approval & Release",
    desc: "A command center aggregates the PRD, tasks, PR status and full AI review history. Admins and Leads approve, and only green features ship.",
    span: "span 3",
  },
];

const stats = [
  { value: "9 steps", label: "From request to shipped, one automated loop" },
  { value: "OWASP", label: "Every PR checked for the Top 10 + performance" },
  { value: "100%", label: "Releases gated on a human reviewer" },
];

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
      <header className="relative z-10 mx-auto flex max-w-[1180px] items-center gap-4 px-7 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoBadge />
          <span className="text-lg font-extrabold tracking-tight">
            ShipFlow<span style={{ color: ACCENT }}> AI</span>
          </span>
        </Link>
        <nav className="ml-6 hidden gap-[22px] sm:flex">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Product</a>
          <a href="#loop" className="text-sm text-muted-foreground hover:text-foreground transition-colors">The Loop</a>
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <Link href="/login" className="px-3 py-2 text-sm font-semibold text-foreground/85 hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-[9px] px-4 py-[9px] text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: ACCENT, color: "oklch(0.13 0 0)" }}
          >
            Open app →
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-[2] mx-auto max-w-[1000px] px-7 pt-16 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
          style={{ border: `1px solid ${ACCENT_LINE}`, background: ACCENT_SOFT, color: ACCENT }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: ACCENT, animation: "sf-glow 1.8s infinite" }}
          />
          Idea → Production, on autopilot
        </div>
        <h1 className="mx-auto mt-6 max-w-[820px] text-[clamp(40px,8vw,64px)] font-extrabold leading-[1.02] tracking-[-0.035em] text-balance">
          Your AI operator for
          <br />
          software <span className="sf-shine-text">delivery</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[600px] text-[18.5px] leading-relaxed text-muted-foreground text-pretty">
          ShipFlow runs the whole loop — clarifies the request, writes the PRD,
          plans the tasks, reviews every pull request against the spec, and gates
          the release on a human. Not a code generator. An operator.
        </p>
        <div className="mt-9 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-[11px] px-6 py-3.5 text-[15.5px] font-bold transition-opacity hover:opacity-90"
            style={{ background: ACCENT, color: "oklch(0.13 0 0)" }}
          >
            Start building free →
          </Link>
          <a
            href="#loop"
            className="rounded-[11px] px-6 py-3.5 text-[15.5px] font-semibold transition-colors"
            style={{
              background: "oklch(0.18 0 0)",
              color: "oklch(0.92 0 0)",
              border: "1px solid oklch(1 0 0 / 0.1)",
            }}
          >
            See the workflow
          </a>
        </div>
      </section>

      {/* showcase: terminal + orbit */}
      <section className="relative z-[2] mx-auto mt-14 grid max-w-[1120px] grid-cols-1 items-center gap-7 px-7 lg:grid-cols-[1.15fr_0.85fr]">
        <TerminalCard />
        <OrbitGraphic />
      </section>

      {/* core loop */}
      <section id="loop" className="relative z-[2] mx-auto mt-[72px] max-w-[1100px] px-7 text-center">
        <div
          className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          The core loop
        </div>
        <div className="mt-[18px] flex flex-wrap items-center justify-center gap-2">
          {loopChips.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="whitespace-nowrap rounded-full px-[17px] py-[9px] text-[13.5px] font-semibold"
                style={{
                  border: `1px solid ${ACCENT_LINE}`,
                  background: "linear-gradient(160deg, oklch(0.2 0 0), oklch(0.155 0 0))",
                  color: "oklch(0.92 0 0)",
                  boxShadow: "0 2px 10px -4px oklch(0 0 0 / 0.6), inset 0 1px 0 oklch(1 0 0 / 0.05)",
                }}
              >
                {label}
              </span>
              {i < loopChips.length - 1 && (
                <span className="text-sm opacity-70" style={{ color: ACCENT }}>→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* bento phases */}
      <section id="features" className="relative z-[2] mx-auto mt-16 max-w-[1100px] px-7">
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {bento.map((b) => (
            <div
              key={b.title}
              className="relative overflow-hidden rounded-[18px] p-6 md:[grid-column:var(--span)]"
              style={
                {
                  "--span": b.span,
                  border: "1px solid oklch(1 0 0 / 0.09)",
                  background: "linear-gradient(165deg, oklch(0.185 0 0), oklch(0.15 0 0))",
                  boxShadow: "0 20px 50px -30px oklch(0 0 0 / 0.9)",
                } as React.CSSProperties
              }
            >
              <div
                className="pointer-events-none absolute h-[140px] w-[140px] rounded-full opacity-50"
                style={{
                  top: -40,
                  right: -40,
                  background: `radial-gradient(circle, ${ACCENT_GLOW}, transparent 70%)`,
                }}
              />
              <div className="relative">
                <div
                  className="inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: ACCENT,
                    border: `1px solid ${ACCENT_LINE}`,
                    background: ACCENT_SOFT,
                  }}
                >
                  {b.phase}
                </div>
                <div className="mt-3.5 text-[19px] font-bold tracking-[-0.01em]">{b.title}</div>
                <div className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* stats */}
      <section className="relative z-[2] mx-auto mt-[54px] max-w-[1100px] px-7">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.value}
              className="relative overflow-hidden rounded-2xl p-6"
              style={{
                border: `1px solid ${ACCENT_LINE}`,
                background: "linear-gradient(165deg, oklch(0.19 0 0), oklch(0.145 0 0))",
                boxShadow: "0 20px 50px -30px oklch(0 0 0 / 0.9)",
              }}
            >
              <div
                className="pointer-events-none absolute h-[120px] w-[120px] rounded-full opacity-45"
                style={{
                  bottom: -30,
                  left: -20,
                  background: `radial-gradient(circle, ${ACCENT_GLOW}, transparent 70%)`,
                }}
              />
              <div className="relative text-[38px] font-extrabold leading-none tracking-[-0.03em]" style={{ color: ACCENT }}>
                {s.value}
              </div>
              <div className="relative mt-[7px] text-[13.5px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
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

function LogoBadge({ size = 26 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center font-extrabold"
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        background: ACCENT,
        color: "oklch(0.13 0 0)",
        fontSize: size * 0.58,
      }}
    >
      S
    </div>
  );
}

function TerminalCard() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        border: "1px solid oklch(1 0 0 / 0.1)",
        background: "linear-gradient(180deg, oklch(0.175 0 0), oklch(0.145 0 0))",
        boxShadow: "0 40px 90px -40px oklch(0 0 0 / 0.85), inset 0 1px 0 oklch(1 0 0 / 0.05)",
      }}
    >
      <div
        className="flex items-center gap-[7px] border-b px-4 py-[13px]"
        style={{ borderColor: "oklch(1 0 0 / 0.07)" }}
      >
        <span className="h-[11px] w-[11px] rounded-full" style={{ background: "oklch(0.62 0.2 25)" }} />
        <span className="h-[11px] w-[11px] rounded-full" style={{ background: "oklch(0.8 0.14 80)" }} />
        <span className="h-[11px] w-[11px] rounded-full" style={{ background: "oklch(0.72 0.16 150)" }} />
        <span className="ml-2.5 text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "oklch(0.6 0 0)" }}>
          shipflow · agent · generating PRD
        </span>
      </div>
      <div className="px-[22px] py-5 text-[13.5px] leading-[1.85]" style={{ fontFamily: "var(--font-mono)" }}>
        <div style={{ color: "oklch(0.66 0 0)" }}>
          <span style={{ color: ACCENT }}>›</span> feature: &quot;SSO login for enterprise customers&quot;
        </div>
        <div style={{ color: "oklch(0.75 0.16 150)" }}>✓ clarified scope — SAML + OIDC, JIT provisioning</div>
        <div style={{ color: "oklch(0.75 0.16 150)" }}>✓ searched existing PRDs — no conflict found</div>
        <div style={{ color: "oklch(0.9 0 0)" }}>
          <span style={{ color: ACCENT }}>goals</span> · SAML 2.0/OIDC, JIT provisioning, audit log
        </div>
        <div style={{ color: "oklch(0.9 0 0)" }}>
          <span style={{ color: ACCENT }}>acceptance</span> · login &lt; 2s, password fallback, RBAC
        </div>
        <div style={{ color: "oklch(0.9 0 0)" }}>
          <span style={{ color: ACCENT }}>tasks</span> · SF-204·1 idp config · ·2 callback · ·3 session map
        </div>
        <div style={{ color: "oklch(0.66 0 0)" }}>
          <span style={{ color: ACCENT }}>›</span> ready for review{" "}
          <span
            className="inline-block align-[-2px]"
            style={{ width: 8, height: 15, background: ACCENT, animation: "sf-blink 1.1s infinite" }}
          />
        </div>
      </div>
    </div>
  );
}

function OrbitGraphic() {
  const radius = 148;
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[360px] items-center justify-center">
      <div
        className="absolute inset-0 rounded-full blur-[8px]"
        style={{ background: `radial-gradient(circle, ${ACCENT_GLOW}, transparent 62%)` }}
      />
      <div className="absolute inset-[8%] rounded-full" style={{ border: "1px dashed oklch(1 0 0 / 0.12)" }} />
      <div className="absolute inset-[24%] rounded-full" style={{ border: "1px solid oklch(1 0 0 / 0.08)" }} />

      {/* rotating ring with nodes */}
      <div className="absolute inset-[8%]" style={{ animation: "sf-orbit 26s linear infinite" }}>
        {orbitIcons.map((icon, i) => {
          const deg = (360 / orbitIcons.length) * i;
          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `translate(-50%,-50%) rotate(${deg}deg) translateY(-${radius}px)` }}
            >
              <div
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] text-[15px]"
                style={{
                  transform: `rotate(${-deg}deg)`,
                  background: "linear-gradient(160deg, oklch(0.22 0 0), oklch(0.16 0 0))",
                  border: `1px solid ${ACCENT_LINE}`,
                  boxShadow: "0 6px 18px -6px oklch(0 0 0 / 0.8)",
                }}
              >
                {icon}
              </div>
            </div>
          );
        })}
      </div>

      {/* center hub */}
      <div
        className="relative flex h-24 w-24 items-center justify-center rounded-[24px]"
        style={{
          background: "linear-gradient(160deg, var(--primary), oklch(0.7 0.13 70))",
          boxShadow: `0 0 50px -8px ${ACCENT_GLOW}, inset 0 1px 0 oklch(1 0 0 / 0.3)`,
        }}
      >
        <div
          className="absolute inset-0 rounded-[24px]"
          style={{ border: `2px solid ${ACCENT_LINE}`, animation: "sf-pulse-ring 2.6s ease-out infinite" }}
        />
        <span className="text-3xl font-extrabold" style={{ color: "oklch(0.13 0 0)" }}>S</span>
      </div>
    </div>
  );
}
