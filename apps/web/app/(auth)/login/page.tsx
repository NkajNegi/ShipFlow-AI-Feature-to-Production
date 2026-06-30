"use client";

import { useState } from "react";
import {
  signIn,
  signUp,
  forgetPassword,
  sendVerificationEmail,
} from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verifyResent, setVerifyResent] = useState(false);

  const handleResendVerification = async () => {
    if (!email) {
      setError("Enter your email above first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error } = await sendVerificationEmail({
        email,
        callbackURL: getRedirect(),
      });
      if (error) throw error;
      setVerifyResent(true);
    } catch (err: any) {
      setError(err?.message || "Could not resend the verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      setError("Enter your email above first, then click “Forgot password?”.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error } = await forgetPassword({
        email,
        redirectTo: "/reset-password",
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setError(err?.message || "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  // Allow post-login redirect (e.g. back to an /invite/<token> page).
  const getRedirect = () => {
    if (typeof window === "undefined") return "/dashboard";
    const r = new URLSearchParams(window.location.search).get("redirect");
    return r && r.startsWith("/") ? r : "/dashboard";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetSent(false);
    setVerifyResent(false);

    try {
      if (isSignUp) {
        const { data, error } = await signUp.email({
          email,
          password,
          name,
        });
        if (error) throw error;
        // If email verification is required, sign-up returns no session token —
        // prompt the user to verify instead of bouncing to a guarded page.
        if (!(data as any)?.token) {
          setNeedsVerification(true);
          return;
        }
      } else {
        const { error } = await signIn.email({
          email,
          password,
          rememberMe,
        });
        if (error) throw error;
      }

      router.push(getRedirect());
    } catch (err: any) {
      const msg = err?.message || "An error occurred";
      // Surface a resend option when the failure is about an unverified email.
      if (/verif/i.test(msg)) setNeedsVerification(true);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await signIn.social({
        provider: "github",
        callbackURL: getRedirect(),
      });
      if (error) throw error;
      // On success the browser is redirected to GitHub; nothing else to do.
    } catch (err: any) {
      setError(err?.message || "Could not start GitHub sign-in.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#000000] text-foreground overflow-hidden">
      {/* Deep Space Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Purple Flare */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#c084fc]/5 blur-[120px] rounded-full" />
        {/* Bottom Left Purple Flare */}
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-[#c084fc]/10 blur-[120px] rounded-full" />
        {/* Bottom Right Green/Gold Flare */}
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-[#facc15]/5 blur-[120px] rounded-full" />
      </div>

      {/* Orbit Graphic (Background) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1400px] pointer-events-none opacity-40">
        {/* Concentric Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full border border-white/5" />

        {/* Floating Nodes */}
        {/* 1. Purple Message */}
        <div className="absolute top-[25%] left-[25%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-[14px] bg-[#c084fc]/10 border border-[#c084fc]/30 flex items-center justify-center text-[#c084fc] shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-md">
          💬
        </div>
        {/* 2. Blue Clipboard */}
        <div className="absolute top-[48%] left-[18%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-[14px] bg-[#60a5fa]/10 border border-[#60a5fa]/30 flex items-center justify-center text-[#60a5fa] shadow-[0_0_20px_rgba(59,130,246,0.3)] backdrop-blur-md">
          📋
        </div>
        {/* 3. Blue Code */}
        <div className="absolute top-[70%] left-[22%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-[14px] bg-[#60a5fa]/10 border border-[#60a5fa]/30 flex items-center justify-center text-[#60a5fa] shadow-[0_0_20px_rgba(59,130,246,0.3)] backdrop-blur-md">
          &lt;/&gt;
        </div>
        {/* 4. Gold Shield */}
        <div className="absolute top-[26%] right-[24%] translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-[14px] bg-[#facc15]/10 border border-[#facc15]/30 flex items-center justify-center text-[#facc15] shadow-[0_0_20px_rgba(250,204,21,0.3)] backdrop-blur-md">
          🛡️
        </div>
        {/* 5. Pink Sparkles */}
        <div className="absolute top-[48%] right-[16%] translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-[14px] bg-[#f472b6]/10 border border-[#f472b6]/30 flex items-center justify-center text-[#f472b6] shadow-[0_0_20px_rgba(236,72,153,0.3)] backdrop-blur-md">
          ✨
        </div>
        {/* 6. Green Rocket */}
        <div className="absolute top-[70%] right-[20%] translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-[14px] bg-[#4ade80]/10 border border-[#4ade80]/30 flex items-center justify-center text-[#4ade80] shadow-[0_0_20px_rgba(34,197,94,0.3)] backdrop-blur-md">
          🚀
        </div>
      </div>

      {/* Top Logo — mark + wordmark lockup */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, #facc15 0%, #f59e0b 100%)",
            boxShadow: "0 4px 30px rgba(250,204,21,0.35)",
          }}
        >
          <span className="text-2xl font-black text-black leading-none">S</span>
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-white">
          ShipFlow<span className="text-[#facc15]"> AI</span>
        </span>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[480px] p-[1px] rounded-[24px] overflow-hidden">
        {/* Animated Gradient Border Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#c084fc] via-transparent to-[#facc15] opacity-50" />

        {/* Inner Card Layer */}
        <div className="relative rounded-[23px] bg-[#0c0c0e]/95 backdrop-blur-3xl px-8 py-10 md:px-12 md:py-12 flex flex-col">
          <div className="text-center mb-10">
            <h1 className="text-[34px] font-bold tracking-tight text-white mb-2">
              {isSignUp ? (
                <>
                  Create <span className="text-[#facc15]">account</span>
                </>
              ) : (
                <>
                  Welcome <span className="text-[#facc15]">back</span>
                </>
              )}
            </h1>
            <p className="text-[14.5px] text-muted-foreground">
              {isSignUp
                ? "Start shipping features from idea to production"
                : "Sign in to your ShipFlow AI account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 flex-1">
            {process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true" && (
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/api/demo-login";
                }}
                className="w-full h-11 mb-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 text-white transition-opacity hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                  boxShadow: "0 4px 14px rgba(16,185,129,0.4)",
                }}
              >
                One-Click Demo Login
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            )}

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-white/90">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white text-[14px] focus:outline-none focus:border-[#c084fc] transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-white/90">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white text-[14px] focus:outline-none focus:border-[#c084fc] transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-white/90">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-white text-[14px] focus:outline-none focus:border-[#c084fc] transition-colors"
                  placeholder={
                    isSignUp ? "At least 8 characters" : "Enter your password"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${rememberMe ? "bg-[#c084fc] text-black" : "bg-white/10 border border-white/20"}`}
                  >
                    {rememberMe && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <span className="text-[12px] text-muted-foreground">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleForgot}
                  disabled={loading}
                  className="text-[12px] text-[#c084fc] hover:underline disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <p className="text-[13px] text-red-400 font-medium">{error}</p>
            )}
            {resetSent && (
              <p className="text-[13px] text-emerald-400 font-medium">
                If an account exists for that email, a password-reset link is on
                its way. Check your inbox.
              </p>
            )}
            {needsVerification && (
              <div className="rounded-xl border border-[#facc15]/30 bg-[#facc15]/5 p-3 space-y-2">
                <p className="text-[13px] font-semibold text-[#facc15]">
                  Verify your email
                </p>
                <p className="text-[12px] text-muted-foreground">
                  We sent a verification link to {email || "your inbox"}. Click
                  it to finish signing in.
                </p>
                {verifyResent ? (
                  <p className="text-[12px] text-emerald-400">
                    Verification email resent.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="text-[12px] text-[#c084fc] hover:underline font-semibold disabled:opacity-50"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(90deg, #c084fc 0%, #facc15 100%)",
                boxShadow: "0 4px 14px rgba(192,132,252,0.4)",
              }}
            >
              {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
              {!loading && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              <span className="bg-[#0c0c0e] px-3">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGithubLogin}
            disabled={loading}
            className="w-full h-11 rounded-xl bg-black border border-white/10 flex items-center justify-center gap-3 text-[14px] font-semibold text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            Continue with GitHub
          </button>

          <div className="mt-8 text-center text-[13px] text-muted-foreground">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#c084fc] hover:underline font-semibold"
            >
              {isSignUp ? "Sign In" : "Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
