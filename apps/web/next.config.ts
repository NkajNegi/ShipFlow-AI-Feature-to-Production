import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages are consumed as TypeScript source and compiled by Next.
  transpilePackages: ["@repo/api", "@repo/db", "@repo/ui", "@repo/inngest"],
  typescript: {
    // Type errors now fail the build (CI check-types is green). Keeps the build
    // honest instead of silently shipping type regressions.
    ignoreBuildErrors: false,
  },
  // Prisma + Octokit/Razorpay are server-only; keep them external to the bundle.
  serverExternalPackages: ["@prisma/client", "@octokit/auth-app", "razorpay"],
};

export default nextConfig;
