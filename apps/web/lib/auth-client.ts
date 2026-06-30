import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
} = authClient;

// Backwards-compatible alias: better-auth renamed `forgetPassword` →
// `requestPasswordReset`. Keep the old name working for existing callers.
export const forgetPassword = requestPasswordReset;
