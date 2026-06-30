"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth-client";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const errorParam = params.get("error");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("This reset link is invalid or has expired. Request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await resetPassword({ newPassword: password, token });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(
        err?.message || "Could not reset password. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const invalidLink = !token || errorParam;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#000000] text-foreground overflow-hidden p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#c084fc]/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-[#facc15]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] p-[1px] rounded-[24px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c084fc] via-transparent to-[#facc15] opacity-50" />
        <div className="relative rounded-[23px] bg-[#0c0c0e]/95 backdrop-blur-3xl px-8 py-10 md:px-12 md:py-12">
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-bold tracking-tight text-white mb-2">
              Reset <span className="text-[#facc15]">password</span>
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Choose a new password for your account.
            </p>
          </div>

          {done ? (
            <p className="text-[14px] text-emerald-400 text-center">
              Password updated. Redirecting to sign in…
            </p>
          ) : invalidLink ? (
            <div className="text-center space-y-4">
              <p className="text-[13px] text-red-400">
                This reset link is invalid or has expired.
              </p>
              <Link
                href="/login"
                className="inline-block text-[13px] text-[#c084fc] hover:underline font-semibold"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-white/90">
                  New password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-[14px] focus:outline-none focus:border-[#c084fc] transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-white/90">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-[14px] focus:outline-none focus:border-[#c084fc] transition-colors"
                />
              </div>

              {error && (
                <p className="text-[13px] text-red-400 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold text-[15px] text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(90deg, #c084fc 0%, #facc15 100%)",
                  boxShadow: "0 4px 14px rgba(192,132,252,0.4)",
                }}
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
