"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Activity, Stethoscope, Users, LineChart, Shield, Heart, Wind, Clock, UserCheck, Database, ArrowRight, Zap, CheckCircle2, UserCircle2, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/common/Header'
import { useAuth } from '@/components/auth/AuthProvider'
import { signInAsGuest } from '@/lib/auth-service'
import { toast } from 'sonner'

const diseases = [
  { code: '01', name: 'ILD', fullName: 'Interstitial Lung Disease', icon: Wind },
  { code: '02', name: 'OAD', fullName: 'Obstructive Airway Disease', icon: Activity },
  { code: '03', name: 'Bronchiectasis', fullName: 'Bronchiectasis', icon: Heart },
  { code: '04', name: 'Post-Recovery', fullName: 'Post-Infection Care', icon: Shield },
]

const features = [
  {
    n: '01',
    icon: Activity,
    title: 'Easy Logs',
    description: 'Track your health and symptoms simply from home.',
  },
  {
    n: '02',
    icon: Wind,
    title: 'Air Quality',
    description: 'Monitor the air quality in your area in real-time.',
  },
  {
    n: '03',
    icon: Shield,
    title: 'Smart Alerts',
    description: 'Our system helps catch health changes early.',
  },
]

const stats = [
  { value: '98%', label: 'Avg. SpO₂ Stability' },
  { value: '<2m', label: 'Daily Log Time' },
  { value: '24/7', label: 'Alert Monitoring' },
]

export default function Home() {
  const router = useRouter()
  const { login } = useAuth()
  const [guestRole, setGuestRole] = useState<"doctor" | "patient" | null>(null)

  const enterAsGuest = async (role: "doctor" | "patient") => {
    setGuestRole(role)
    try {
      const result = await signInAsGuest(role)
      if (result.success && result.token) {
        const profile = role === "doctor" ? (result as any).doctorProfile : (result as any).patientProfile
        const user = {
          id: profile.id,
          email: profile.email,
          role: role as any,
          fullName: profile.fullName
        }
        login(result.token, user)
        toast.success(`Continuing as guest ${role}.`)
        router.push(role === "doctor" ? `/doctor/dashboard/${user.id}` : "/patient/dashboard")
      } else {
        toast.error(result.error || "Guest login failed.")
        setGuestRole(null)
      }
    } catch (err) {
      toast.error("An unexpected system error occurred.")
      setGuestRole(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] selection:bg-teal-100">
      <Header currentPage="home" />

      {}
      <section className="bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="container mx-auto px-6 relative z-10 pt-16 pb-12">
          <div className="grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-teal-500/30 bg-teal-500/10 text-teal-400 text-[10px] font-mono uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                System Online — Smart Respiratory Care
              </div>
              <h1 className="font-heading text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02] mb-5 text-white">
                Breathe better,<br />
                <span className="text-teal-400">tracked better.</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-lg leading-relaxed mb-8">
                A direct line between patients and doctors — daily respiratory logs, live air quality, and early-warning alerts in one system.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/sign-in">
                  <Button className="h-11 px-6 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-md text-sm font-bold tracking-tight border-2 border-teal-500 shadow-[4px_4px_0_0_#134e4a] hover:shadow-[2px_2px_0_0_#134e4a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    <Stethoscope className="w-4 h-4 mr-2" />
                    For Doctors
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" className="h-11 px-6 text-white bg-transparent border-2 border-white/20 hover:bg-white/5 hover:border-white/40 rounded-md text-sm font-bold tracking-tight transition-all">
                    For Patients
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 flex lg:justify-end">
              <div className="flex flex-col gap-2.5 w-full max-w-[220px]">
                <button
                  onClick={() => enterAsGuest("doctor")}
                  disabled={guestRole !== null}
                  className="flex items-center justify-between gap-2 h-11 px-4 border border-white/15 bg-white/[0.03] text-white text-[10px] font-mono uppercase tracking-widest hover:bg-white/[0.08] hover:border-white/30 transition-all disabled:opacity-50"
                >
                  <span className="flex items-center gap-2"><UserCircle2 className="w-3.5 h-3.5" />{guestRole === "doctor" ? "Entering..." : "Guest Doctor"}</span>
                  <ArrowUpRight className="w-3 h-3 text-teal-400" />
                </button>
                <button
                  onClick={() => enterAsGuest("patient")}
                  disabled={guestRole !== null}
                  className="flex items-center justify-between gap-2 h-11 px-4 border border-white/15 bg-white/[0.03] text-white text-[10px] font-mono uppercase tracking-widest hover:bg-white/[0.08] hover:border-white/30 transition-all disabled:opacity-50"
                >
                  <span className="flex items-center gap-2"><UserCircle2 className="w-3.5 h-3.5" />{guestRole === "patient" ? "Entering..." : "Guest Patient"}</span>
                  <ArrowUpRight className="w-3 h-3 text-teal-400" />
                </button>
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-3 border-t border-white/10 mt-12 pt-6">
            {stats.map((s) => (
              <div key={s.label} className="border-l border-white/10 first:border-l-0 pl-5 first:pl-0">
                <div className="font-mono text-2xl md:text-3xl font-bold text-teal-400">{s.value}</div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
            {diseases.map((d) => (
              <div key={d.name} className="group py-8 px-5 hover:bg-slate-50/50 transition-colors cursor-default">
                <div className="flex items-center justify-between mb-4">
                  <d.icon className="w-5 h-5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                  <span className="font-mono text-[9px] text-slate-300">{d.code}</span>
                </div>
                <h3 className="font-heading text-sm font-semibold text-slate-900">{d.name}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{d.fullName}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20 bg-[#faf9f6]">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-teal-600">— Why SaansSync</span>
              <h2 className="font-heading text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight leading-tight mt-3">
                Care that fits into your life.
              </h2>
              <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                We've made health monitoring simple with an interface built for clarity and peace of mind.
              </p>
            </div>

            <div className="lg:col-span-8 grid sm:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
              {features.map((f) => (
                <div key={f.n} className="bg-white p-6 group hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-9 h-9 rounded-md bg-slate-950 flex items-center justify-center group-hover:bg-teal-600 transition-colors">
                      <f.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-mono text-[10px] text-slate-300">{f.n}</span>
                  </div>
                  <h4 className="font-heading text-sm font-semibold text-slate-900 mb-1.5">{f.title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {}
      <footer className="py-10 bg-slate-950 text-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center overflow-hidden">
                  <img src="/favicon.ico" alt="Logo" className="w-4 h-4 object-contain" />
                </div>
                <span className="font-heading text-base font-semibold tracking-tight">SaansSync</span>
              </div>
              <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
                A platform for smart respiratory care and remote health monitoring.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-3">
                <h5 className="font-mono text-[9px] uppercase tracking-widest text-slate-500">Portal</h5>
                <div className="flex flex-col gap-2">
                  <Link href="/sign-in" className="text-xs text-slate-300 hover:text-teal-400 transition-colors">Clinicians</Link>
                  <Link href="/sign-in" className="text-xs text-slate-300 hover:text-teal-400 transition-colors">Patients</Link>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="font-mono text-[9px] uppercase tracking-widest text-slate-500">Company</h5>
                <div className="flex flex-col gap-2">
                  <Link href="/about" className="text-xs text-slate-300 hover:text-teal-400 transition-colors">About</Link>
                  <Link href="/contact" className="text-xs text-slate-300 hover:text-teal-400 transition-colors">Contact</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-6 border-t border-white/10 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            <span>© 2026 SaansSync</span>
            <div className="flex gap-6">
              <span>Privacy</span>
              <span>Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
