"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff 
} from "lucide-react";
import { resetPasswordAction } from "@/app/actions/auth";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(token ? null : "Missing password reset token in URL.");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!token) {
      setErrorMessage("Missing reset token. Please request a new recovery link.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordAction(token, password);
      if (res.success) {
        setSuccessMessage(res.message || "Password reset successful! Redirecting to sign in...");
        setTimeout(() => {
          router.push("/auth?mode=signin");
        }, 2000);
      } else {
        setErrorMessage(res.error || "Failed to reset password.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-[#161616] border border-[rgba(0,72,187,0.3)] text-[#0048BB] flex items-center justify-center mx-auto shadow-xl">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8F3F0]">Set New Password</h1>
          <p className="text-xs text-[#A8A196]">
            Enter your new secure password below to regain access to your account.
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-[#1f0e0e] border border-red-500/30 text-red-300 text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-[#0e1f14] border border-[#5EBA8C]/30 text-[#5EBA8C] text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-[#5EBA8C] shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Reset Form */}
        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-[#A8A196] mb-1.5">New Password (Min 8 chars, 1 number, 1 letter)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A8A196] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#080808] border border-[rgba(248,243,240,0.12)] focus:outline-none focus:ring-1 focus:ring-[#0048BB] text-xs text-[#F8F3F0] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#A8A196] hover:text-[#F8F3F0]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#A8A196] mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A8A196] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#080808] border border-[rgba(248,243,240,0.12)] focus:outline-none focus:ring-1 focus:ring-[#0048BB] text-xs text-[#F8F3F0] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full mt-2 py-3 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white font-semibold text-xs shadow-md shadow-[#0048BB]/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            href="/auth?mode=signin"
            className="text-xs text-[#A8A196] hover:text-[#F8F3F0] transition"
          >
            ← Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[75vh] flex items-center justify-center p-4 text-[#F8F3F0]">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-[#0048BB] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading reset password workspace...</span>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
