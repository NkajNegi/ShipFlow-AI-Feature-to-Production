import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="px-6 lg:px-14 h-16 flex items-center border-b border-border">
        <Link className="flex items-center justify-center" href="#">
          <span className="text-xl font-bold text-primary">ShipFlow AI</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#">
            Pricing
          </Link>
        </nav>
        <div className="ml-6">
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex flex-col items-center justify-center text-center px-4 md:px-6">
          <div className="space-y-4 max-w-[800px]">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-foreground drop-shadow-sm">
              Your AI Operator for <span className="text-primary">Software Delivery</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Move from idea to production 10x faster with AI-driven PRDs, automated tasks, and intelligent code review.
            </p>
            <div className="space-x-4 mt-8">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/login">Start Building Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border text-foreground hover:text-primary">
                <Link href="#demo">View Demo</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
