import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { TRPCReactProvider } from "@/trpc/Provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ShipFlow AI",
  description: "Your AI Operator for Software Delivery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("dark font-sans", inter.variable, jetbrainsMono.variable)}
    >
      <body className={cn(inter.className, "bg-background text-foreground min-h-screen relative overflow-x-hidden antialiased")}>
        {/* Ambient Background Orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] mix-blend-screen opacity-70 animate-slow-spin" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[150px] mix-blend-screen opacity-50 animate-slow-spin-reverse" />
          <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px] mix-blend-screen opacity-40 animate-pulse-slow" />
          {/* Subtle grid texture instead of missing image */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
        </div>

        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
