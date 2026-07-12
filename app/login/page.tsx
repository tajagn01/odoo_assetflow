"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { Mail, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [showPassword, setShowPassword] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(false)
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.toLowerCase().trim(),
        password,
      })

      console.log("signIn res:", res)

      if (!res?.ok) {
        const cleanMsg = res?.error === "CredentialsSignin" || res?.error === "Error" || res?.error === "undefined"
          ? "Invalid email or password."
          : res?.error || "Invalid email or password."
        setError(cleanMsg)
      } else {
        let targetUrl = callbackUrl
        if (targetUrl.includes("/login")) {
          targetUrl = "/dashboard"
        }
        router.push(targetUrl)
        router.refresh()
      }
    } catch (err) {
      console.error("signIn error:", err)
      setError("An unexpected error occurred during login. Please try again.")
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
                Welcome back
              </h1>
              <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                Log in to manage organization resources
              </p>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 p-3 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/50 animate-in fade-in zoom-in duration-200">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="loginEmail" className="text-zinc-800 dark:text-zinc-200">Email address</Label>
                <Input
                  id="loginEmail"
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="loginPassword" className="text-zinc-800 dark:text-zinc-200">Password</Label>
                </div>
                <Input
                  id="loginPassword"
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
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={isLoading}
                    className="border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-white focus:ring-zinc-950"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 cursor-pointer select-none"
                  >
                    Remember 30 days
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  className="h-10 w-full rounded-lg font-bold text-xs bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 border border-transparent transition-all cursor-pointer shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative mt-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-100 dark:border-zinc-800" />
              </div>
              <span className="relative bg-white dark:bg-zinc-900 px-3 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                or continue with
              </span>
            </div>

            {/* Social Logins */}
            <div className="mt-6 flex gap-3">
              {/* Github */}
              <button
                type="button"
                onClick={() => alert("OAuth Single Sign-On is available in Enterprise tier only. Please log in with your email credentials.")}
                className="flex flex-1 h-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all text-zinc-900 dark:text-white text-xs font-bold gap-2 cursor-pointer shadow-sm"
                title="Sign in with GitHub"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </button>

              {/* Google */}
              <button
                type="button"
                onClick={() => alert("OAuth Single Sign-On is available in Enterprise tier only. Please log in with your email credentials.")}
                className="flex flex-1 h-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all text-zinc-900 dark:text-white text-xs font-bold gap-2 cursor-pointer shadow-sm"
                title="Sign in with Google"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.386-2.876-6.386-6.386 0-3.51 2.876-6.386 6.386-6.386 1.543 0 2.949.553 4.043 1.478l3.1-3.1C18.66 1.83 15.65 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.033 0 10.978-4.945 10.978-10.978 0-.84-.084-1.638-.222-2.422H12.24z" />
                </svg>
                <span>Google</span>
              </button>
            </div>

            {/* Demo Login Accounts */}
            <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 p-3 space-y-2">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                Quick Demo ERP Profiles
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    role: "Admin",
                    email: "newadmin@assetflow.com",
                    pass: "AdminPassword123!",
                  },
                  {
                    role: "Asset Manager",
                    email: "manager@assetflow.com",
                    pass: "ManagerPassword123!",
                  },
                  {
                    role: "Dept Head",
                    email: "head@assetflow.com",
                    pass: "HeadPassword123!",
                  },
                  {
                    role: "Employee",
                    email: "amit@assetflow.com",
                    pass: "EmployeePassword123!",
                  },
                ].map((demo) => (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => {
                      setEmail(demo.email);
                      setPassword(demo.pass);
                    }}
                    className="flex flex-col text-left p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer select-none active:scale-95"
                  >
                    <span className="text-[9px] font-black text-zinc-800 dark:text-zinc-200">{demo.role}</span>
                    <span className="text-[8px] text-zinc-450 dark:text-zinc-400 truncate w-full">{demo.email}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Link to Signup */}
            <div className="mt-6 text-center text-xs font-semibold text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-zinc-900 dark:text-white font-bold hover:underline"
              >
                Sign up
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

          <div className="relative z-10 space-y-4">
            <blockquote className="space-y-2">
              <p className="text-lg font-medium leading-relaxed text-zinc-100">
                "AssetFlow completely replaced our inventory spreadsheets. The double-allocation checker and resource calendars work flawlessly."
              </p>
              <footer className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                — Sarah Jenkins, VP of Operations
              </footer>
            </blockquote>
          </div>

          <div className="relative z-10 text-[9px] text-zinc-500 font-bold tracking-wider uppercase">
            Enterprise Asset Management ERP v1.0
          </div>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-zinc-900 dark:text-zinc-100 font-sans font-semibold">
          Loading login form...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}
