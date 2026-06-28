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
      <body className={cn(inter.className, "bg-black text-foreground min-h-screen relative overflow-x-hidden antialiased")}>
        {/* Ambient Grid Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-black">
          {/* Subtle Dot Matrix */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_10%,transparent_100%)] opacity-60" />
          
          {/* Extremely subtle aurora meshes (Vercel style) */}
          <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-[oklch(0.6_0.2_250)] blur-[200px] mix-blend-screen opacity-10 animate-slow-spin" />
          <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[oklch(0.6_0.2_300)] blur-[150px] mix-blend-screen opacity-10 animate-slow-spin-reverse" />
        </div>

        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
