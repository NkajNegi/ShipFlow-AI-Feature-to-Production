import { MarketingHeader } from "@/components/marketing-header";
import Link from "next/link";

const ACCENT = "var(--primary)";
const ACCENT_LINE = "oklch(0.82 0.14 85 / 0.38)";
const ACCENT_GLOW = "oklch(0.82 0.14 85 / 0.22)";

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-foreground font-sans">
      <MarketingHeader />

      <section className="relative z-10 mx-auto max-w-4xl px-7 pt-24 text-center">
        <h1 className="text-[clamp(40px,8vw,64px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
          Simple, transparent <span className="sf-shine-text">pricing</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[600px] text-[18.5px] leading-relaxed text-muted-foreground">
          Start for free, upgrade when you need unlimited AI review loops and
          premium integrations.
        </p>
      </section>

      <section className="relative z-10 mx-auto mt-20 grid max-w-[900px] grid-cols-1 md:grid-cols-2 gap-8 px-7 pb-32">
        {/* Free Tier */}
        <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] p-8 glass flex flex-col">
          <h2 className="text-2xl font-bold">Starter</h2>
          <p className="mt-2 text-muted-foreground">
            For individuals and open source.
          </p>
          <div className="my-6 text-5xl font-extrabold">
            $0
            <span className="text-lg text-muted-foreground font-normal">
              /mo
            </span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3">
              <span style={{ color: ACCENT }}>✓</span> 3 AI Projects
            </li>
            <li className="flex items-center gap-3">
              <span style={{ color: ACCENT }}>✓</span> 100 AI PR Reviews/mo
            </li>
            <li className="flex items-center gap-3">
              <span style={{ color: ACCENT }}>✓</span> Community Support
            </li>
          </ul>
          <Link
            href="/login"
            className="w-full text-center rounded-xl border border-white/10 bg-white/5 py-3 font-semibold hover:bg-white/10 transition-colors"
          >
            Start Free
          </Link>
        </div>

        {/* Pro Tier */}
        <div className="rounded-3xl border border-white/20 bg-[#121212] p-8 glass spotlight-card relative flex flex-col shadow-[0_0_50px_rgba(var(--primary),0.1)] overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-primary to-blue-500" />
          <h2 className="text-2xl font-bold">Pro</h2>
          <p className="mt-2 text-muted-foreground">
            For engineering teams shipping fast.
          </p>
          <div className="my-6 text-5xl font-extrabold">
            $49
            <span className="text-lg text-muted-foreground font-normal">
              /seat/mo
            </span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3">
              <span style={{ color: ACCENT }}>✓</span> Unlimited AI Projects
            </li>
            <li className="flex items-center gap-3">
              <span style={{ color: ACCENT }}>✓</span> Unlimited AI PR Reviews
            </li>
            <li className="flex items-center gap-3">
              <span style={{ color: ACCENT }}>✓</span> Advanced OWASP Checks
            </li>
            <li className="flex items-center gap-3">
              <span style={{ color: ACCENT }}>✓</span> GitHub Enterprise Sync
            </li>
          </ul>
          <Link
            href="/login"
            className="w-full text-center rounded-xl py-3 font-bold text-black ai-glow-border transition-all"
            style={{ background: ACCENT }}
          >
            Upgrade to Pro
          </Link>
        </div>
      </section>
    </div>
  );
}
