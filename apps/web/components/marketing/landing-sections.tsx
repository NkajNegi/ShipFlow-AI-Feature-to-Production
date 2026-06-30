"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  GitPullRequest,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Layers,
  KeyRound,
  Bot,
  ChevronDown,
  GitBranch,
  CreditCard,
  Bell,
  Zap,
} from "lucide-react";

const ACCENT = "var(--primary)";

/* ---------------------------------------------------------------------------
   Reveal — fade/translate a section in when it scrolls into view.
--------------------------------------------------------------------------- */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-[640px] text-center">
      <span
        className="text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: ACCENT }}
      >
        {eyebrow}
      </span>
      <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-extrabold tracking-[-0.03em]">
        {title}
      </h2>
      {sub && (
        <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
          {sub}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   How it works — numbered pipeline.
--------------------------------------------------------------------------- */
const STEPS = [
  { n: "01", t: "Request", d: "An AI PM clarifies the ask and checks for duplicates." },
  { n: "02", t: "PRD", d: "A rigorous spec: goals, AC, security, rollback plan." },
  { n: "03", t: "Tasks", d: "An engineering breakdown on a Kanban board." },
  { n: "04", t: "AI Review", d: "Every PR reviewed against the spec — twice, by two models." },
  { n: "05", t: "Human gate", d: "A human approves before anything ships." },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative z-[2] mx-auto max-w-[1200px] px-7 py-24">
      <Reveal>
        <SectionHeading
          eyebrow="How it works"
          title="Idea to production, in one disciplined loop"
          sub="MetroFlow runs every stage — and a human always makes the final call."
        />
      </Reveal>
      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 80}>
            <div className="h-full rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-5">
              <div
                className="text-[26px] font-extrabold tracking-tight"
                style={{ color: ACCENT }}
              >
                {s.n}
              </div>
              <h3 className="mt-2 text-[15px] font-semibold text-white">{s.t}</h3>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-muted-foreground/80">
                {s.d}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   PR review showcase — the product made concrete. Branded multi-model + critic.
--------------------------------------------------------------------------- */
export function ReviewShowcase() {
  return (
    <section id="review" className="relative z-[2] mx-auto max-w-[1100px] px-7 py-24">
      <Reveal>
        <SectionHeading
          eyebrow="AI code review"
          title="Two models review every PR. A critic checks their work."
          sub="Not a syntax linter — a QA reviewer that judges the diff against your PRD, then a second model audits the findings."
        />
      </Reveal>
      <Reveal delay={120}>
        <div className="mx-auto mt-12 max-w-[760px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d10]/80 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          {/* PR header */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
            <GitPullRequest className="h-5 w-5 text-emerald-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                Add user data export for compliance{" "}
                <span className="text-muted-foreground">#142</span>
              </p>
              <p className="text-xs text-muted-foreground">
                shipflow/feat-export → main · Closes SF-87
              </p>
            </div>
            <span className="ml-auto rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
              Changes requested
            </span>
          </div>

          {/* AI review comment */}
          <div className="space-y-3 px-5 py-5">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4" style={{ color: ACCENT }} />
              <span className="font-semibold text-white">
                Code review by MetroFlow AI
              </span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-muted-foreground">
                <Layers className="h-3 w-3" /> 2 models + critic
              </span>
            </div>

            <div className="rounded-lg border border-red-500/25 bg-red-500/[0.06] p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-red-400">
                <ShieldAlert className="h-4 w-4" /> Blocking · Security
              </p>
              <p className="mt-1 text-sm text-foreground/90">
                Missing rate limit on the export endpoint.
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                src/api/export.ts:38 — add throttling before streaming records.
              </p>
            </div>

            <div className="rounded-lg border border-red-500/25 bg-red-500/[0.06] p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-red-400">
                <ShieldAlert className="h-4 w-4" /> Blocking · Audit
              </p>
              <p className="mt-1 text-sm text-foreground/90">
                Audit log not written on the download path.
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                src/api/export.ts:61 — record an AuditLog entry per export.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3 text-sm text-emerald-400">
              <ShieldCheck className="h-4 w-4" /> Critic verified — 2 findings
              confirmed, 1 false positive dropped.
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Agent teaser.
--------------------------------------------------------------------------- */
export function AgentTeaser() {
  return (
    <section id="agent" className="relative z-[2] mx-auto max-w-[1100px] px-7 py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <span
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: ACCENT }}
          >
            Copilot
          </span>
          <h2 className="mt-3 text-[clamp(26px,3.2vw,38px)] font-extrabold tracking-[-0.03em]">
            Drive the whole pipeline by chat
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
            Ask the agent to triage requests, generate a PRD, run a review, or
            explain how to implement any task — it calls the same tools the app
            does, with the human gate still enforced.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-block rounded-full px-6 py-3 text-[15px] font-bold transition-all hover:brightness-110"
            style={{ background: "#FFC250", color: "#111" }}
          >
            Try the agent →
          </Link>
        </Reveal>

        <Reveal delay={120}>
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d10]/80 p-4 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-white/[0.06] px-3.5 py-2 text-sm text-foreground/90">
                Triage all submitted features and explain SF-87.
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Bot className="h-4 w-4" style={{ color: ACCENT }} />
              </div>
              <div className="space-y-2">
                <div className="rounded-2xl rounded-bl-sm bg-white/[0.04] px-3.5 py-2 text-sm text-foreground/90">
                  Triaged 4 features. 1 is P0 (high risk: data migration).
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
                  <span style={{ color: ACCENT }}>▸ tool</span>{" "}
                  explain_task(SF-87) · walkthrough drafted across 3 providers
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Multi-model engine band — our moat. Qship cannot write this.
--------------------------------------------------------------------------- */
const ENGINE = [
  {
    icon: Layers,
    t: "Multi-provider",
    d: "Drafts across Anthropic, OpenRouter, Google & OpenAI — no single point of failure.",
  },
  {
    icon: ShieldCheck,
    t: "Critic-audited",
    d: "A second model audits the first's output and drops hallucinated findings.",
  },
  {
    icon: KeyRound,
    t: "Bring your own key",
    d: "Use your own Anthropic key — encrypted at rest with AES-256-GCM, never stored in plaintext.",
  },
];

export function EngineBand() {
  return (
    <section
      id="engine"
      className="relative z-[2] mx-auto my-8 max-w-[1100px] px-7 py-20"
    >
      <Reveal>
        <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-10">
          <SectionHeading
            eyebrow="The engine"
            title="Most tools bet on one model. We don't."
            sub="MetroFlow runs an ensemble and a critic on top of your own key — more accurate, more resilient, and yours to control."
          />
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {ENGINE.map((e, i) => (
              <Reveal key={e.t} delay={i * 100}>
                <div className="h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <e.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold text-white">
                    {e.t}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-[1.6] text-muted-foreground/80">
                    {e.d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Integrations strip.
--------------------------------------------------------------------------- */
const INTEGRATIONS = [
  { icon: GitBranch, label: "GitHub App" },
  { icon: CreditCard, label: "Razorpay" },
  { icon: Bell, label: "Slack / Discord" },
  { icon: Sparkles, label: "Claude" },
  { icon: Zap, label: "Inngest" },
];

export function Integrations() {
  return (
    <section className="relative z-[2] mx-auto max-w-[1100px] px-7 py-12">
      <Reveal>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Works with your stack
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {INTEGRATIONS.map((it) => (
            <div
              key={it.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-foreground/80"
            >
              <it.icon className="h-4 w-4" style={{ color: ACCENT }} />
              {it.label}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   FAQ — replants the BYOK / multi-model message.
--------------------------------------------------------------------------- */
const FAQS = [
  {
    q: "Is this just a code generator?",
    a: "No. MetroFlow is an operator: it clarifies the request, writes the PRD, plans tasks, reviews PRs against the spec, and gates the release on a human. Code generation is one optional step.",
  },
  {
    q: "Which AI models does it use?",
    a: "An ensemble — Anthropic Claude, OpenRouter, Google, and OpenAI — with a separate critic model that audits the output. If one provider is down, the loop still completes.",
  },
  {
    q: "Can I use my own API key?",
    a: "Yes. Bring your own Anthropic key; it's encrypted at rest with AES-256-GCM and never returned to the client. Your AI usage is billed to your account.",
  },
  {
    q: "How does the human approval gate work?",
    a: "A feature can only ship after AI review passes with zero blocking issues AND a human (Admin/Lead) approves. Every decision is recorded in an audit trail.",
  },
  {
    q: "What does it cost?",
    a: "Free to start with platform AI credits. Upgrade for more, or bring your own key and run on your own account.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative z-[2] mx-auto max-w-[760px] px-7 py-24">
      <Reveal>
        <SectionHeading eyebrow="Questions" title="Frequently asked" />
      </Reveal>
      <div className="mt-10 space-y-3">
        {FAQS.map((f, i) => (
          <Reveal key={f.q} delay={i * 60}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 text-left transition-colors hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-[15px] font-semibold text-white">
                  {f.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </div>
              {open === i && (
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              )}
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
