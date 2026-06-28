import Link from "next/link";

const ACCENT = "var(--primary)";

export function LogoBadge({ size = 26 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center font-extrabold relative overflow-hidden group transition-shadow duration-300"
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        background: ACCENT,
        color: "oklch(0.13 0 0)",
        fontSize: size * 0.58,
        boxShadow: `0 0 10px ${ACCENT}80`,
      }}
    >
      {/* Animated M */}
      <span className="relative z-10 animate-pulse transform transition-transform duration-500 group-hover:scale-110">M</span>
    </div>
  );
}

export function MarketingHeader() {
  return (
    <header className="relative z-10 mx-auto flex max-w-[1180px] items-center gap-4 px-7 py-5">
      <Link href="/" className="flex items-center gap-2.5">
        <LogoBadge />
        <span className="text-lg font-extrabold tracking-tight">
          MetroFlow<span style={{ color: ACCENT }}> AI</span>
        </span>
      </Link>
      <nav className="ml-6 hidden gap-[22px] sm:flex">
        <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Pricing
        </Link>
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Docs
        </Link>
      </nav>
      <div className="ml-auto flex items-center gap-2.5">
        <Link href="/login" className="px-3 py-2 text-sm font-semibold text-foreground/85 hover:text-foreground transition-colors">
          Sign in
        </Link>
        <Link
          href="/login"
          className="rounded-full px-5 py-2 text-sm font-bold transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,165,36,0.4)]"
          style={{ background: "#FFC250", color: "#111" }}
        >
          Open app →
        </Link>
      </div>
    </header>
  );
}
