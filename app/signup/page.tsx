"use client"

import * as React from "react"
import Link from "next/link"
import { Mail, Eye, EyeOff, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import { useRouter } from "next/navigation"
import { registerUser } from "@/actions/auth"

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [agreeTerms, setAgreeTerms] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeTerms) {
      setError("You must agree to the Terms & Conditions.")
      return
    }
    
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const res = await registerUser({ name, email, password })
      if (!res.success) {
        const fieldErr = res.errors ? Object.values(res.errors)[0]?.[0] : null
        setError(fieldErr || res.message || "Registration failed. Please try again.")
      } else {
        setSuccess(res.message || "Registration successful! Redirecting to login...")
        setTimeout(() => {
          router.push("/login")
        }, 1500)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 md:p-12 font-sans select-none">
      <div className="flex w-full max-w-[1050px] min-h-[640px] flex-col overflow-hidden rounded-[2rem] bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 shadow-xl md:flex-row md:p-4">
        
        {/* Left Side: Auth Form */}
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
                Create account
              </h1>
              <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                Provision a new employee work account
              </p>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 p-3 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/50 animate-in fade-in zoom-in duration-200">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 rounded-xl bg-green-50 dark:bg-green-950/30 p-3 text-xs font-semibold text-green-600 dark:text-green-400 border border-green-100 dark:border-green-950/50 animate-in fade-in zoom-in duration-200">
                {success}
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="signupName" className="text-zinc-800 dark:text-zinc-200">Full Name</Label>
                <Input
                  id="signupName"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  icon={<User className="h-4 w-4 text-zinc-400" />}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus-visible:ring-zinc-950 dark:focus-visible:ring-white h-10"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="signupEmail" className="text-zinc-800 dark:text-zinc-200">Email Address</Label>
                <Input
                  id="signupEmail"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  icon={<Mail className="h-4 w-4 text-zinc-400" />}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus-visible:ring-zinc-950 dark:focus-visible:ring-white h-10"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="signupPassword" className="text-zinc-800 dark:text-zinc-200">Password</Label>
                <Input
                  id="signupPassword"
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
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus-visible:ring-zinc-950 dark:focus-visible:ring-white h-10"
                />
                
                {/* Real-time Validation Checklist */}
                {password && (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 text-[10px] space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Security Matrix</span>
                    <div className="flex items-center space-x-1.5">
                      {password.length >= 8 ? <span className="text-zinc-950 dark:text-white font-bold">✓</span> : <span className="text-zinc-300 dark:text-zinc-700">✗</span>}
                      <span className={password.length >= 8 ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>At least 8 characters</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {/[A-Z]/.test(password) && /[a-z]/.test(password) ? <span className="text-zinc-950 dark:text-white font-bold">✓</span> : <span className="text-zinc-300 dark:text-zinc-700">✗</span>}
                      <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>Upper & lowercase letters</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {/[0-9]/.test(password) ? <span className="text-zinc-950 dark:text-white font-bold">✓</span> : <span className="text-zinc-300 dark:text-zinc-700">✗</span>}
                      <span className={/[0-9]/.test(password) ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>At least one numeric digit</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {/[^a-zA-Z0-9]/.test(password) ? <span className="text-zinc-950 dark:text-white font-bold">✓</span> : <span className="text-zinc-300 dark:text-zinc-700">✗</span>}
                      <span className={/[^a-zA-Z0-9]/.test(password) ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>At least one special character</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-center space-x-2 px-1">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                  required
                  disabled={isLoading}
                  className="border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-white focus:ring-zinc-950"
                />
                <Label
                  htmlFor="terms"
                  className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 cursor-pointer select-none"
                >
                  I agree to the Terms & Conditions
                </Label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  className="h-10 w-full rounded-lg font-bold text-xs bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 border border-transparent transition-all cursor-pointer shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing up..." : "Sign up"}
                </Button>
              </div>
            </form>

            {/* Link to Login */}
            <div className="mt-8 text-center text-xs font-semibold text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-zinc-900 dark:text-white font-bold hover:underline"
              >
                Login
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Brand Pane */}
        <div className="relative hidden md:flex flex-1 flex-col justify-between bg-zinc-950 p-12 text-white overflow-hidden rounded-[1.5rem] border-l border-zinc-900">
          {/* Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
          
          <div className="relative z-10 flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950 font-black text-sm">AF</div>
            <span className="text-sm font-black tracking-wider uppercase">ASSET<span className="text-zinc-400 font-medium">FLOW</span></span>
          </div>

          <div className="relative z-10 my-auto space-y-6">
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-3xl font-black tracking-tight text-white">Get Started!</h2>
              <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                Create your employee profile to join your company department space. Request custody transitions, check out devices, and book reservations conflict-free.
              </p>
            </div>
            
            <div className="h-px bg-zinc-800" />
            
            <blockquote className="space-y-2">
              <p className="text-sm font-medium leading-relaxed text-zinc-300 italic">
                "Our team registers and returns devices in seconds. Booking meeting rooms and booking company vehicles is completely conflict-free."
              </p>
              <footer className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">
                — David Miller, IT Administrator
              </footer>
            </blockquote>

            {/* Platform Security & Highlights Detail */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2.5">
              <span className="text-[8px] font-black text-zinc-550 uppercase tracking-widest block">
                Platform Security & Highlights
              </span>
              <div className="grid grid-cols-2 gap-2.5 text-[10px] font-bold text-zinc-400">
                <div className="flex items-start gap-1.5">
                  <span className="text-zinc-550 font-black">✓</span>
                  <span>Strict RBAC Security Matrices</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-zinc-550 font-black">✓</span>
                  <span>Immutable System Operations Logs</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-zinc-550 font-black">✓</span>
                  <span>Depreciation SL & WDV Projection Engines</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-zinc-550 font-black">✓</span>
                  <span>Real-time Double Booking Allocation Checkers</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-[9px] text-zinc-550 font-bold tracking-wider uppercase">
            Enterprise Asset Management ERP v1.0
          </div>
        </div>

      </div>
    </div>
  )
}
