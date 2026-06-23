import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@repo/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Password policy.
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Email verification is opt-in via env so local/demo isn't blocked when no
    // mail provider is configured. Enable in production with a real sender.
    requireEmailVerification:
      process.env.REQUIRE_EMAIL_VERIFICATION === "true",
  },
  emailVerification: {
    // Plug a real email provider here in production. For now the link is logged.
    sendVerificationEmail: async ({ user, url }) => {
      console.log(`[email-verification] ${user.email}: ${url}`);
    },
  },
  // Throttle auth endpoints (login/signup) to slow brute-force attempts.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});

export type Auth = typeof auth;
