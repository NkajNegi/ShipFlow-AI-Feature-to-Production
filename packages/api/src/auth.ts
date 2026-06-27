import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@repo/db";

// Only enable GitHub social login when BOTH credentials are present. Otherwise
// better-auth would emit an OAuth URL with `client_id=undefined`, sending users
// to a GitHub error page. With this guard, an unconfigured GitHub button gets a
// clean "provider not configured" error instead.
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const githubConfigured = Boolean(githubClientId && githubClientSecret);

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
  socialProviders: githubConfigured
    ? {
        github: {
          clientId: githubClientId as string,
          clientSecret: githubClientSecret as string,
        },
      }
    : {},
});

export type Auth = typeof auth;
