"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { signInDoctorWithPassword, signInPatientWithPassword } from "@/lib/auth-service"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Shield, Zap, Wind, Activity, Heart, ShieldCheck, Database, Lock } from "lucide-react"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"doctor" | "patient">("doctor")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

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
        const user = {
          id: userProfile.id,
          email: userProfile.email,
          role: role as any,
          fullName: userProfile.full_name || userProfile.fullName
        };
        login(result.token, user)
        toast.success("Identity verified. Access granted.")
        if (role === "doctor") {
          router.push(`/doctor/dashboard/${user.id}`)
        } else {
          router.push("/patient/dashboard")
        }
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
    <div className="flex min-h-screen bg-white font-['Matter_Regular',sans-serif]">
      {/* Visual Context - Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 p-20 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <Wind className="w-[150%] h-[150%] -rotate-12 translate-x-1/4 translate-y-1/4 text-white" />
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-4 text-white mb-32 group">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-2.5 group-hover:scale-110 transition-all duration-500 shadow-2xl">
                <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-2xl tracking-tight leading-none">SaansSync</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Smart Care v3.4</span>
            </div>
          </Link>
          
          <div className="max-w-lg space-y-10">
            <h1 className="text-6xl font-bold text-white tracking-tight leading-[0.9]">
              Simplified Care.<br />
              Professional.<br />
              <span className="text-purple-500/40">Synchronized.</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm">
              Sign in to your account to stay connected and manage respiratory health with ease.
            </p>
          </div>
        </div>

            <div className="flex items-center gap-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-xl max-w-md group">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-slate-400 border border-white/10">
                    <ShieldCheck className="w-7 h-7 text-purple-400" />
                </div>
                <div>
                    <p className="text-white font-bold text-sm tracking-tight uppercase">Secure Access</p>
                    <p className="text-slate-500 text-[11px] font-medium mt-1 leading-relaxed">Your data is protected with industrial-grade encryption and privacy controls.</p>
                </div>
            </div>
            <div className="flex items-center gap-10 px-2">
                <div className="flex flex-col gap-1">
                    <span className="text-3xl font-bold text-white tracking-tight">99.9%</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Reliability</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex flex-col gap-1">
                    <span className="text-3xl font-bold text-white tracking-tight">Fast</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sync Speed</span>
                </div>
            </div>
        </div>

      {/* Auth Interface - Right Side */}
      <div className="w-full lg:w-1/2 flex flex-col p-12 lg:p-24 relative bg-white">
        <div className="absolute top-12 left-12">
          <Link href="/" className="inline-flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all font-bold text-[10px] uppercase tracking-widest group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Home
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Sign In</h2>
            <p className="text-slate-500 font-medium text-lg">Welcome back. Please enter your details.</p>
          </div>

          <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl mb-10 border border-slate-100">
            <button
              type="button"
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${role === "doctor" ? "bg-white shadow-sm text-purple-600" : "text-slate-400 hover:text-slate-600"}`}
              onClick={() => setRole("doctor")}
            >
              Doctor
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${role === "patient" ? "bg-white shadow-sm text-purple-600" : "text-slate-400 hover:text-slate-600"}`}
              onClick={() => setRole("patient")}
            >
              Patient
            </button>
          </div>

          <form onSubmit={handleSignIn} className="space-y-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="h-14 bg-slate-50 border-none rounded-xl px-6 font-bold text-slate-900 placeholder:text-slate-200 focus-visible:ring-slate-100 transition-all text-sm"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="password" title="password" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</Label>
                  <button type="button" className="text-[9px] font-bold text-purple-600 uppercase tracking-widest hover:underline underline-offset-4">Forgot password?</button>
                </div>
                <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-14 bg-slate-50 border-none rounded-xl px-6 focus-visible:ring-slate-100 font-bold text-slate-900 tracking-widest transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg tracking-tight shadow-xl shadow-slate-100 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-4"
            >
              {loading ? (
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 animate-pulse" />
                    Signing in...
                  </div>
              ) : (
                  <>
                    Sign In
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </>
              )}
            </Button>

            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-purple-600 hover:underline underline-offset-4">
                Sign Up
              </Link>
            </p>
          </form>
        </div>
        
        <div className="mt-20 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-3">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Secure & Private Architecture</span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                © 2026 SaansSync • All data is encrypted and protected
            </p>
        </div>
      </div>
    </div>
  )
}
