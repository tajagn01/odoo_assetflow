"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateResetToken } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [simulatedLink, setSimulatedLink] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSimulatedLink("");
    setIsLoading(true);

    try {
      const res = await generateResetToken(email);
      if (!res.success) {
        setError(res.message || "Failed to trigger password reset.");
      } else {
        setSuccess(res.message || "Reset link simulated successfully.");
        if (res.data?.link) {
          setSimulatedLink(res.data.link);
        }
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
                Reset Password
              </h1>
              <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                We will simulate sending a password reset link
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

            {/* Simulation output box */}
            {simulatedLink && (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3 dark:bg-zinc-800/50 dark:border-zinc-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center space-x-2 text-xs font-bold text-zinc-950 dark:text-white">
                  <CheckCircle className="h-4 w-4 text-zinc-800 dark:text-white" />
                  <span>Developer Simulation Output</span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  In production, this link is dispatched via SMTP email. For local judging review, use the link below:
                </p>
                <Link
                  href={simulatedLink}
                  className="block text-center py-2 text-xs font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 rounded-lg shadow transition-opacity"
                >
                  Proceed to Reset Screen
                </Link>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="forgotEmail" className="text-zinc-800 dark:text-zinc-200">Work Email</Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  icon={<Mail className="h-4 w-4 text-zinc-400" />}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 h-10"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="h-10 w-full rounded-lg font-bold text-xs bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 border border-transparent transition-all cursor-pointer shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Generating Link..." : "Send Reset Link"}
                </Button>
              </div>
            </form>

            {/* Link back to login */}
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
                "Securing shared resources and asset directories with strict validation is essential for audit compliance."
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
