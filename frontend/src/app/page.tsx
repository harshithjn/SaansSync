"use client"

import Link from "next/link"
import { Activity, Stethoscope, Users, LineChart, Shield, Heart, Wind, Clock, UserCheck, Database, ArrowRight, Zap, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Header } from '@/components/common/Header'

const diseases = [
  { name: 'ILD', fullName: 'Interstitial Lung Disease', icon: Wind },
  { name: 'OAD', fullName: 'Obstructive Airway Disease', icon: Activity },
  { name: 'Bronchiectasis', fullName: 'Bronchiectasis', icon: Heart },
  { name: 'Post-Recovery', fullName: 'Post-Infection Care', icon: Shield },
]

const features = [
  {
    icon: Activity,
    title: 'Easy Logs',
    description: 'Track your health and symptoms simply from home.',
  },
  {
    icon: Wind,
    title: 'Air Quality',
    description: 'Monitor the air quality in your area in real-time.',
  },
  {
    icon: Shield,
    title: 'Smart Alerts',
    description: 'Our system helps catch health changes early.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-['Matter_Regular',sans-serif] selection:bg-slate-100 italic-none">
      <Header currentPage="home" />

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden bg-white">
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-[10px] font-bold uppercase tracking-widest mb-10">
                <CheckCircle2 className="w-3 h-3" />
                <span>Smart Respiratory Care</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold text-slate-900 tracking-tight mb-8 leading-[0.9]">
              Breathe <br className="hidden md:block" /> <span className="text-purple-600">Better.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-xl leading-relaxed">
              A simple and professional way for patients to stay connected with their doctors and manage their lung health together.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
              <Link href="/sign-in">
                <Button className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-md font-bold tracking-tight transition-all active:scale-95 shadow-xl shadow-slate-100">
                  <Stethoscope className="w-4 h-4 mr-2" />
                  For Doctors
                </Button>
              </Link>

              <Link href="/sign-in">
                <Button variant="ghost" className="h-14 px-8 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl text-md font-bold tracking-tight transition-all">
                  For Patients
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Grid */}
      <section className="py-32 border-y border-slate-50 bg-[#FAFAFA]">
        <div className="container mx-auto px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl mx-auto">
                {diseases.map((d, i) => (
                    <div key={d.name} className="group cursor-default">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 mb-6 transition-all group-hover:shadow-md">
                            <d.icon className="w-6 h-6 text-slate-900 group-hover:text-purple-600 transition-colors" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">{d.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{d.fullName}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Feature Split */}
      <section className="py-40 bg-white">
        <div className="container mx-auto px-8 max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-32 items-center">
                <div className="space-y-16">
                    <div className="space-y-6">
                        <h2 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                            Care that fits <br /> into your life.
                        </h2>
                        <p className="text-lg text-slate-500 font-medium max-w-md">
                            We’ve made health monitoring simple with an easy-to-use interface built for clarity and peace of mind.
                        </p>
                    </div>
                    <div className="space-y-10">
                        {features.map((f, i) => (
                            <div key={i} className="flex gap-8 group">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 group-hover:bg-purple-600 transition-all duration-300">
                                    <f.icon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 tracking-tight mb-1">{f.title}</h4>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">{f.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative">
                    <div className="aspect-square bg-purple-50/30 rounded-[3rem] border border-purple-100/50 overflow-hidden shadow-xl shadow-purple-50 p-10 flex items-center justify-center group relative">
                        <Activity className="w-40 h-40 text-purple-100/50 group-hover:text-purple-200/50 transition-colors duration-700" />
                        <div className="absolute bottom-10 left-10 right-10 p-6 bg-white rounded-2xl border border-slate-100 shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Status</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900 tracking-tight">98 <span className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">% Oxygen</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-white border-t border-slate-50">
        <div className="container mx-auto px-8 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-24">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                        <img src="/favicon.ico" alt="Logo" className="w-6 h-6 object-contain" />
                    </div>
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">SaansSync</span>
                </div>
                <p className="text-slate-500 text-sm font-medium max-w-xs leading-relaxed">
                    A simple and professional platform for smart respiratory care and remote health monitoring.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-24">
                <div className="space-y-6">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Portal</h5>
                    <div className="flex flex-col gap-4">
                        <Link href="/sign-in" className="text-sm font-medium text-slate-400 hover:text-slate-950 transition-colors">Clinicians</Link>
                        <Link href="/sign-in" className="text-sm font-medium text-slate-400 hover:text-slate-950 transition-colors">Patients</Link>
                    </div>
                </div>
                <div className="space-y-6">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Company</h5>
                    <div className="flex flex-col gap-4">
                        <Link href="/about" className="text-sm font-medium text-slate-400 hover:text-slate-950 transition-colors">About</Link>
                        <Link href="/contact" className="text-sm font-medium text-slate-400 hover:text-slate-950 transition-colors">Contact</Link>
                    </div>
                </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-12 border-t border-slate-50 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            <span>© 2026 SaansSync Architecture.</span>
            <div className="flex gap-8">
                <span>Privacy</span>
                <span>Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
