"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { signUpDoctor, signUpPatient } from "@/lib/auth-service"
import Link from "next/link"
import { ArrowLeft, Users, Star, Sparkles, Wind, Shield, CheckCircle2, ShieldCheck, Activity, Zap, Heart, Database, Lock, UserCircle } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"doctor" | "patient">("doctor")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let result;
      if (role === "doctor") {
        result = await signUpDoctor(email, fullName, password)
      } else {
        result = await signUpPatient(email, fullName, password)
      }

      if (result.success) {
        toast.success("Registration successful. Please proceed to verification.")
        router.push("/sign-in")
      } else {
        toast.error(result.error || "Registration failed. Please attempt again.")
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
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 p-20 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <Sparkles className="w-[120%] h-[120%] -translate-x-1/4 -translate-y-1/4 text-white rotate-12" />
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
              Start Your<br />
              Health<br />
              <span className="text-teal-500/40">Journey.</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm">
              Create your account to stay connected and manage your health with ease.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-xl max-w-md group">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-slate-400 border border-white/10">
                    <Users className="w-7 h-7 text-teal-400" />
                </div>
                <div>
                    <p className="text-white font-bold text-sm tracking-tight uppercase">Better Connection</p>
                    <p className="text-slate-500 text-[11px] font-medium mt-1 leading-relaxed">Direct connection between home care and your doctor for better insights.</p>
                </div>
            </div>
            <div className="flex items-center gap-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-xl max-w-md group">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-slate-400 border border-white/10">
                    <CheckCircle2 className="w-7 h-7 text-teal-400" />
                </div>
                <div>
                    <p className="text-white font-bold text-sm tracking-tight uppercase">Friendly Design</p>
                    <p className="text-slate-500 text-[11px] font-medium mt-1 leading-relaxed">A simple and professional interface built for patients and doctors.</p>
                </div>
            </div>
        </div>
      </div>

      {}
      <div className="w-full lg:w-1/2 flex flex-col p-12 lg:p-24 relative bg-white overflow-y-auto">
        <div className="md:absolute md:top-12 md:left-12 mb-12 md:mb-0">
          <Link href="/" className="inline-flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all font-bold text-[10px] uppercase tracking-widest group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Home
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-20">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Sign Up</h2>
            <p className="text-slate-500 font-medium text-lg">Create your clinical profile to begin.</p>
          </div>

          <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl mb-10 border border-slate-100">
            <button
              type="button"
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${role === "doctor" ? "bg-white shadow-sm text-teal-600" : "text-slate-400 hover:text-slate-600"}`}
              onClick={() => setRole("doctor")}
            >
              Doctor
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${role === "patient" ? "bg-white shadow-sm text-teal-600" : "text-slate-400 hover:text-slate-600"}`}
              onClick={() => setRole("patient")}
            >
              Patient
            </button>
          </div>

          <form className="space-y-10" onSubmit={handleSignUp}>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="fullName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                <Input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="h-14 bg-slate-50 border-none rounded-xl px-6 font-bold text-slate-900 placeholder:text-slate-200 focus-visible:ring-slate-100 transition-all text-sm"
                />
              </div>
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
                <Label htmlFor="password" title="password" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</Label>
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
              className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg tracking-tight shadow-xl shadow-slate-100 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-4"
            >
              {loading ? (
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 animate-pulse" />
                    Creating account...
                  </div>
              ) : (
                  <>
                    Sign Up
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </>
              )}
            </Button>

            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-teal-600 hover:underline underline-offset-4">
                Login
              </Link>
            </p>
          </form>
        </div>

        <div className="mt-12 text-center lg:text-left">
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
