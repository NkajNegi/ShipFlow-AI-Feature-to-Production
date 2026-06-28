import Link from "next/link";

const ACCENT = "var(--primary)";

export function LogoBadge({ size = 26 }: { size?: number }) {
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

export function MarketingHeader() {
  return (
    <header className="relative z-10 mx-auto flex max-w-[1180px] items-center gap-4 px-7 py-5">
      <Link href="/" className="flex items-center gap-2.5">
        <LogoBadge />
        <span className="text-lg font-extrabold tracking-tight">
          ShipFlow<span style={{ color: ACCENT }}> AI</span>
        </span>
      </Link>
      <nav className="ml-6 hidden gap-[22px] sm:flex">
        <Link href="/product" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Product
        </Link>
        <Link href="/the-loop" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          The Loop
        </Link>
        <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Pricing
        </Link>
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
  );
}
