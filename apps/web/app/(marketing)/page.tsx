import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ListTodo,
  GitPullRequest,
  ShieldCheck,
  Rocket,
  ArrowRight,
} from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen flex flex-col text-foreground">
      <header className="px-6 lg:px-14 h-16 flex items-center border-b border-border/60 sticky top-0 z-50 bg-background/80 backdrop-blur">
        <Link className="flex items-center gap-2" href="/">
          <span className="text-xl font-bold tracking-tight">
            ShipFlow <span className="text-primary">AI</span>
          </span>
        </Link>
        <nav className="ml-auto hidden sm:flex gap-6">
          <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#flow">
            How it works
          </Link>
        </nav>
        <div className="ml-6 flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 55% 50% at 50% 0%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 70%)",
            }}
          />
          <div className="relative w-full py-20 md:py-28 flex flex-col items-center text-center px-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Idea → Production, on autopilot
            </div>
            <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl text-balance">
              Your AI Operator for{" "}
              <span className="text-primary">Software Delivery</span>
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg mt-6 text-pretty">
              Move from idea to production 10x faster with AI-driven PRDs,
              automated task planning, and an intelligent code-review loop.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-9">
              <Button asChild size="lg">
                <Link href="/login">
                  Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#flow">See the workflow</Link>
              </Button>
            </div>

            {/* PRD demo mock */}
            <div className="mt-16 w-full max-w-3xl text-left">
              <PrdDemo />
            </div>
          </div>
        </section>

        {/* Bento feature grid */}
        <section id="features" className="px-4 md:px-6 py-16 md:py-24 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center text-balance">
            The Core Loop, automated
          </h2>
          <p className="text-muted-foreground text-center mt-3 max-w-2xl mx-auto text-pretty">
            Feature Request → Product Thinking → PRD → Tasks → Implementation →
            Review → Approval → Release.
          </p>

          <div id="flow" className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <BentoCard
              className="md:col-span-2"
              icon={<Sparkles className="h-5 w-5" />}
              title="Discovery & PRD"
              desc="An AI Product Manager clarifies the request, checks for duplicates, then generates a strict PRD: problem, goals, user stories, acceptance criteria, edge cases, and success metrics."
            />
            <BentoCard
              icon={<ListTodo className="h-5 w-5" />}
              title="Planning"
              desc="The PRD is converted into engineering tasks on a drag-and-drop Kanban board."
            />
            <BentoCard
              icon={<GitPullRequest className="h-5 w-5" />}
              title="Development"
              desc="Connect GitHub. Reference a task (Closes SF-123) in your PR and ShipFlow maps it automatically."
            />
            <BentoCard
              className="md:col-span-2"
              icon={<ShieldCheck className="h-5 w-5" />}
              title="AI Review Loop"
              desc="A QA agent reviews each PR against the PRD, acceptance criteria, security (OWASP Top 10), performance, and edge cases — flagging issues as blocking or non-blocking and posting them straight to GitHub."
            />
            <BentoCard
              className="md:col-span-3"
              icon={<Rocket className="h-5 w-5" />}
              title="Human Approval & Release"
              desc="A command center aggregates the PRD, tasks, PR status, and full AI review history. Admins and Leads approve, and only green features ship."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden border-t border-border/60">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 50% 100%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 70%)",
            }}
          />
          <div className="px-4 py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ship with confidence.
            </h2>
            <p className="text-muted-foreground mt-3">
              Free to start. No credit card required.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/login">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/60 px-6 py-8 text-center text-sm text-muted-foreground">
        ShipFlow AI — Your AI Operator for Software Delivery.
      </footer>
    </div>
  );
}

function BentoCard({
  icon,
  title,
  desc,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  className?: string;
}) {
  return (
    <div
      className={`group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 ${className}`}
    >
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 transition-colors group-hover:bg-primary/15">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{desc}</p>
    </div>
  );
}

function PrdDemo() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-amber-500/70" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
        <span className="ml-3 text-xs text-muted-foreground font-mono">
          shipflow · generating PRD
        </span>
      </div>
      <div className="p-5 font-mono text-sm space-y-2">
        <p className="text-muted-foreground">
          <span className="text-primary">›</span> Feature: “Add SSO login for
          enterprise customers”
        </p>
        <p className="text-emerald-400">✓ Clarified requirements</p>
        <p className="text-emerald-400">✓ Checked existing PRDs — no conflicts</p>
        <p className="text-foreground">
          <span className="text-primary">Goals</span> · SAML + OIDC, JIT
          provisioning, audit logging
        </p>
        <p className="text-foreground">
          <span className="text-primary">Acceptance</span> · Login &lt; 2s,
          fallback to password, RBAC enforced
        </p>
        <p className="text-foreground">
          <span className="text-primary">Tasks</span> · SF-1 IdP config · SF-2
          callback route · SF-3 session mapping
        </p>
        <p className="text-muted-foreground">
          <span className="text-primary">›</span> Ready for review{" "}
          <span className="inline-block animate-pulse">▍</span>
        </p>
      </div>
    </div>
  );
}
