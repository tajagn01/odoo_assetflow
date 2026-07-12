"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Mail, Eye, EyeOff, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [agreeTerms, setAgreeTerms] = React.useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // No backend code written, as requested.
    console.log("Signup submitted", { name, email, password, agreeTerms })
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#1034a6] p-4 sm:p-6 md:p-12 font-sans select-none">
      <div className="flex w-full max-w-[1050px] min-h-[640px] flex-col overflow-hidden rounded-[2.5rem] bg-white p-3 shadow-2xl md:flex-row md:p-4">
        {/* Left Side: Form */}
        <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-12 md:max-w-[480px]">
          <div className="mx-auto w-full max-w-[340px] md:mx-0">
            {/* Logo/Emoji */}
            <div className="flex justify-center md:justify-start">
              <span className="text-3xl" role="img" aria-label="home">
                🏠
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="mt-4 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
                Create account
              </h1>
              <p className="mt-1 text-sm text-zinc-500 font-medium">
                Please enter your details to sign up.
              </p>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-1">
                <Input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  icon={<User className="h-4 w-4 text-zinc-400" />}
                />
              </div>

              <div className="space-y-1">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  icon={<Mail className="h-4 w-4 text-zinc-400" />}
                />
              </div>

              <div className="space-y-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  icon={
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="flex h-5 w-5 items-center justify-center text-zinc-400 hover:text-zinc-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-center space-x-2 px-1">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                  required
                />
                <Label
                  htmlFor="terms"
                  className="text-xs font-semibold text-zinc-500 cursor-pointer select-none"
                >
                  I agree to the Terms & Conditions
                </Label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="h-12 w-full rounded-full font-semibold text-sm"
                >
                  Sign up
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative mt-8 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-100" />
              </div>
              <span className="relative bg-white px-3 text-xs font-medium text-zinc-400">
                or
              </span>
            </div>

            {/* Social Logins */}
            <div className="mt-8 flex justify-center gap-4">
              {/* Apple */}
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 transition-all hover:bg-zinc-50 active:scale-95"
                title="Sign up with Apple"
              >
                <svg className="h-5 w-5 fill-zinc-900" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39" />
                </svg>
              </button>

              {/* Google */}
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 transition-all hover:bg-zinc-50 active:scale-95"
                title="Sign up with Google"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.39-4.87 3.39-8.55z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.24 10.55c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.39 2.96C.5 4.77 0 6.83 0 9s.5 4.23 1.39 6.04l3.85-3.05z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 18.96c2.7 0 4.96-.9 6.62-2.45l-3.66-2.84c-1.01.68-2.31 1.09-3.96 1.09-3.34 0-5.86-1.81-6.76-4.51L1.39 13.3c1.98 3.89 5.96 6.56 10.61 6.56z"
                  />
                </svg>
              </button>

              {/* Facebook */}
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 transition-all hover:bg-zinc-50 active:scale-95"
                title="Sign up with Facebook"
              >
                <svg className="h-5 w-5 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
            </div>

            {/* Link to Login */}
            <div className="mt-8 text-center text-xs font-semibold text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#1034a6] hover:underline"
              >
                Login
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Artwork */}
        <div className="relative hidden md:block flex-1 overflow-hidden rounded-[2rem]">
          <Image
            src="/auth_banner.png"
            alt="Beautiful abstract digital gradient artwork banner"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 0vw, 50vw"
          />
        </div>
      </div>
    </div>
  )
}
