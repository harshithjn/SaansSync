"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { signInDoctorWithPassword, signInPatientWithPassword, signInAsGuest } from "@/lib/auth-service"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Shield, Zap, Wind, Activity, Heart, ShieldCheck, Database, Lock, UserCircle2 } from "lucide-react"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"doctor" | "patient">("doctor")
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const enterWithSession = (
    token: string,
    profile: any,
    signedInRole: "doctor" | "patient"
  ) => {
    const user = {
      id: profile.id,
      email: profile.email,
      role: signedInRole as any,
      fullName: profile.fullName
    }
    login(token, user)
    if (signedInRole === "doctor") {
      router.push(`/doctor/dashboard/${user.id}`)
    } else {
      router.push("/patient/dashboard")
    }
  }

  const handleGuestLogin = async () => {
    setGuestLoading(true)
    try {
      const result = await signInAsGuest(role)
      if (result.success && result.token) {
        const profile = role === "doctor" ? (result as any).doctorProfile : (result as any).patientProfile
        enterWithSession(result.token, profile, role)
        toast.success(`Continuing as guest ${role}.`)
      } else {
        toast.error(result.error || "Guest login failed.")
      }
    } catch (err) {
      toast.error("An unexpected system error occurred.")
    } finally {
      setGuestLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let result;
      if (role === "doctor") {
        result = await signInDoctorWithPassword(email, password)
      } else {
        result = await signInPatientWithPassword(email, password)
      }

      if (result.success && result.token) {
        const userProfile = role === "doctor" ? (result as any).doctorProfile : (result as any).patientProfile;
        enterWithSession(result.token, userProfile, role)
        toast.success("Identity verified. Access granted.")
      } else {
        toast.error(result.error || "Verification failed. Please check your credentials.")
      }
    } catch (err) {
      toast.error("An unexpected system error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 text-white mb-24 group">
            <div className="w-10 h-10 bg-white flex items-center justify-center p-2 group-hover:scale-105 transition-all duration-300">
                <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
                <span className="font-heading font-semibold text-lg tracking-tight leading-none">SaansSync</span>
                <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest mt-1">Smart Care v3.4</span>
            </div>
          </Link>

          <div className="max-w-lg space-y-6">
            <h1 className="font-heading text-5xl font-semibold text-white tracking-tight leading-[1.02]">
              Simplified care.<br />
              <span className="text-teal-400">Synchronized.</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Sign in to your account to stay connected and manage respiratory health with ease.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4 p-5 border border-white/10 bg-white/[0.02] max-w-md">
                <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-teal-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-white font-semibold text-xs tracking-tight uppercase">Secure Access</p>
                    <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">Your data is protected with industrial-grade encryption.</p>
                </div>
            </div>
            <div className="grid grid-cols-2 border-t border-white/10 pt-5">
                <div className="border-l border-white/10 pl-4">
                    <span className="font-mono text-2xl font-bold text-teal-400 block">99.9%</span>
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Reliability</span>
                </div>
                <div className="border-l border-white/10 pl-4">
                    <span className="font-mono text-2xl font-bold text-teal-400 block">Fast</span>
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Sync Speed</span>
                </div>
            </div>
        </div>
      </div>

      {}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16 relative bg-white">
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-mono text-[10px] uppercase tracking-widest group">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-semibold text-slate-900 tracking-tight mb-2">Sign In</h2>
            <p className="text-slate-500 text-sm">Welcome back. Please enter your details.</p>
          </div>

          <div className="flex border border-slate-200 mb-8">
            <button
              type="button"
              className={`flex-1 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-all duration-300 ${role === "doctor" ? "bg-slate-950 text-white" : "text-slate-400 hover:text-slate-700"}`}
              onClick={() => setRole("doctor")}
            >
              Doctor
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-all duration-300 border-l border-slate-200 ${role === "patient" ? "bg-slate-950 text-white" : "text-slate-400 hover:text-slate-700"}`}
              onClick={() => setRole("patient")}
            >
              Patient
            </button>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="h-11 bg-white border border-slate-200 rounded-md px-4 font-medium text-slate-900 placeholder:text-slate-300 focus-visible:ring-0 focus-visible:border-slate-900 transition-all text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" title="password" className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">Password</Label>
                  <button type="button" className="font-mono text-[9px] text-teal-600 uppercase tracking-widest hover:underline underline-offset-4">Forgot password?</button>
                </div>
                <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 bg-white border border-slate-200 rounded-md px-4 focus-visible:ring-0 focus-visible:border-slate-900 font-medium text-slate-900 tracking-widest transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-md font-bold text-sm tracking-tight border-2 border-teal-500 shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center justify-center gap-3"
            >
              {loading ? (
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 animate-pulse" />
                    Signing in...
                  </div>
              ) : (
                  <>
                    Sign In
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </>
              )}
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="font-mono text-[9px] text-slate-300 uppercase tracking-widest">Or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={guestLoading}
              onClick={handleGuestLogin}
              className="w-full h-12 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-md font-bold text-sm tracking-tight transition-all duration-300 flex items-center justify-center gap-3"
            >
              {guestLoading ? (
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 animate-pulse" />
                    Entering...
                  </div>
              ) : (
                  <>
                    <UserCircle2 className="w-4 h-4" />
                    Continue as Guest {role === "doctor" ? "Doctor" : "Patient"}
                  </>
              )}
            </Button>

            <p className="text-center font-mono text-[10px] text-slate-400 uppercase tracking-widest">
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-teal-600 hover:underline underline-offset-4">
                Sign Up
              </Link>
            </p>
          </form>
        </div>

        <div className="mt-12 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">Secure & Private Architecture</span>
            </div>
            <p className="font-mono text-[9px] text-slate-300 uppercase tracking-widest">
                © 2026 SaansSync • All data is encrypted and protected
            </p>
        </div>
      </div>
    </div>
  )
}
