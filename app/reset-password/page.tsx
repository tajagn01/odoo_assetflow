"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, Check, X, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateAndResetPassword } from "@/actions/auth";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Password rules validation criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing in the URL.");
      return;
    }
    if (!isFormValid) {
      setError("Please satisfy all password validation constraints.");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await validateAndResetPassword({ token, password });
      if (!res.success) {
        setError(res.message || "Failed to reset password.");
      } else {
        setSuccess(res.message || "Password successfully reset!");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 md:p-12 font-sans select-none">
      <div className="flex w-full max-w-[1050px] min-h-[640px] flex-col overflow-hidden rounded-[2rem] bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 shadow-xl md:flex-row md:p-4">
        
        {/* Left Side: Reset Form */}
        <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-12 md:max-w-[480px]">
          <div className="mx-auto w-full max-w-[340px] md:mx-0">
            {/* Minimal Brand Logo */}
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-black text-sm">
                AF
              </div>
              <span className="text-sm font-black tracking-wider text-zinc-950 dark:text-white uppercase">
                Asset<span className="text-zinc-500 dark:text-zinc-400 font-medium">Flow</span>
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="mt-8 text-left">
              <h1 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                Enter New Password
              </h1>
              <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                Provide secure login credentials
              </p>
            </div>

            {/* Notifications */}
            {error && (
              <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 p-3 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/50">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 rounded-xl bg-green-50 dark:bg-green-950/30 p-3 text-xs font-semibold text-green-600 dark:text-green-400 border border-green-100 dark:border-green-950/50">
                {success}
              </div>
            )}

            {!token ? (
              <div className="mt-6 rounded-xl bg-amber-50 p-4 border border-amber-200 text-xs font-semibold text-amber-800">
                Warning: No reset token was found in the URL. Go back to forgot password to request a simulated token link.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    icon={
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="flex h-5 w-5 items-center justify-center text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 h-10"
                  />
                </div>

                {/* Password strength visual guidelines */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 text-[10px] space-y-1.5">
                  <span className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Security Matrix</span>
                  
                  <div className="flex items-center space-x-1.5">
                    {hasMinLength ? <Check className="h-3 w-3 text-zinc-950 dark:text-white" /> : <X className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />}
                    <span className={hasMinLength ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>At least 8 characters</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {hasUppercase && hasLowercase ? <Check className="h-3 w-3 text-zinc-950 dark:text-white" /> : <X className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />}
                    <span className={hasUppercase && hasLowercase ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>Upper & lowercase letters</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {hasNumber ? <Check className="h-3 w-3 text-zinc-950 dark:text-white" /> : <X className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />}
                    <span className={hasNumber ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>At least one numeric digit</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {hasSpecial ? <Check className="h-3 w-3 text-zinc-950 dark:text-white" /> : <X className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />}
                    <span className={hasSpecial ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>At least one special character</span>
                  </div>

                  <div className="flex items-center space-x-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-1.5 mt-1.5">
                    {passwordsMatch ? <Check className="h-3 w-3 text-zinc-950 dark:text-white" /> : <X className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />}
                    <span className={passwordsMatch ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>Passwords match</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="h-10 w-full rounded-lg font-bold text-xs bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 border border-transparent transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    disabled={isLoading || !isFormValid}
                  >
                    {isLoading ? "Saving password..." : "Confirm & Save Password"}
                  </Button>
                </div>
              </form>
            )}

            {/* Back Link */}
            <div className="mt-8 text-center text-xs font-semibold">
              <Link
                href="/login"
                className="inline-flex items-center text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Brand Pane */}
        <div className="relative hidden md:flex flex-1 flex-col justify-between bg-zinc-950 p-12 text-white overflow-hidden rounded-[1.5rem] border-l border-zinc-900">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
          
          <div className="relative z-10 flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950 font-black text-sm">AF</div>
            <span className="text-sm font-black tracking-wider uppercase">ASSET<span className="text-zinc-400 font-medium">FLOW</span></span>
          </div>

          <div className="relative z-10 space-y-4">
            <blockquote className="space-y-2">
              <p className="text-lg font-medium leading-relaxed text-zinc-100">
                "Robust key validation cycles and token expiry rules prevent unauthorized account hijack attempts."
              </p>
              <footer className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                — SOC2 Compliance Guideline
              </footer>
            </blockquote>
          </div>

          <div className="relative z-10 text-[9px] text-zinc-500 font-bold tracking-wider uppercase">
            Enterprise Asset Management ERP v1.0
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-zinc-900 dark:text-zinc-100 font-sans font-semibold">
          Initializing reset session...
        </div>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}
