"use client"

import { Header } from '@/components/common/Header'
import { Activity, Shield, Target, Award, ArrowRight, Wind, Zap, Heart, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Header currentPage="about" />

            <main className="container mx-auto px-8 py-32">
                {}
                <div className="max-w-5xl mb-40 relative">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-slate-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-teal-50 text-teal-600 text-[10px] font-bold uppercase tracking-widest mb-10 border border-teal-100 shadow-sm relative z-10">
                        <Activity className="w-3.5 h-3.5" />
                        Our Mission
                    </div>
                    <h1 className="text-6xl md:text-8xl font-bold text-slate-900 tracking-tight mb-10 leading-[0.9] relative z-10">
                        Precision Care<br />
                        <span className="text-teal-600/20">Synchronized.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-3xl relative z-10">
                        SaansSync is a smart platform dedicated to improving respiratory health through real-time monitoring and helpful insights for both patients and doctors.
                    </p>
                </div>

                {}
                <div className="grid md:grid-cols-3 gap-12 mb-48">
                    {[
                        {
                            icon: Target,
                            title: "Reliable Data",
                            desc: "We provide accurate, real-time health data to help doctors give the best possible care.",
                            color: "bg-white text-slate-900 border border-slate-100 shadow-sm"
                        },
                        {
                            icon: ShieldCheck,
                            title: "Private & Secure",
                            desc: "Your health information is protected with industry-standard security and privacy protocols.",
                            color: "bg-white text-slate-900 border border-slate-100 shadow-sm"
                        },
                        {
                            icon: Award,
                            title: "Expert Backed",
                            desc: "Developed alongside leading respiratory specialists to ensure the highest quality of care.",
                            color: "bg-white text-slate-900 border border-slate-100 shadow-sm"
                        }
                    ].map((pillar, i) => (
                        <div key={i} className={`p-8 rounded-[2.5rem] space-y-6 flex flex-col justify-between transition-all hover:translate-y-[-4px] duration-300 ${pillar.color}`}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-teal-50 text-teal-600">
                                <pillar.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold tracking-tight mb-3 text-slate-900">{pillar.title}</h3>
                                <p className="text-sm font-medium leading-relaxed text-slate-500">
                                    {pillar.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {}
                <div className="p-16 md:p-32 rounded-[4rem] bg-slate-950 text-white relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] group cursor-default">
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03] pointer-events-none group-hover:scale-110 transition-all duration-[2000ms]">
                        <Wind className="w-full h-full text-white rotate-12" />
                    </div>
                    <div className="relative z-10 max-w-3xl">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/10 text-white text-[9px] font-bold uppercase tracking-widest mb-10 border border-white/10 backdrop-blur-md">
                            Join Us
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold mb-10 tracking-tight leading-tight text-white">Ready to improve<br />your health journey?</h2>
                        <div className="flex flex-col sm:flex-row gap-5">
                            <Link href="/sign-up">
                                <Button className="h-16 px-10 bg-white text-slate-950 rounded-2xl font-bold text-lg tracking-tight hover:bg-teal-50 active:scale-[0.98] transition-all shadow-xl">
                                    Get Started
                                    <ArrowRight className="w-5 h-5 ml-3" />
                                </Button>
                            </Link>
                            <Link href="/contact">
                                <Button variant="outline" className="h-16 px-10 border-white/20 text-white bg-transparent rounded-2xl font-bold text-lg tracking-tight hover:bg-white hover:text-slate-950 transition-all">
                                    Contact Us
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-24 border-t border-slate-50 bg-white">
                <div className="container mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                            <img src="/favicon.ico" alt="Logo" className="w-7 h-7 object-contain" />
                        </div>
                        <div className="flex flex-col">
                             <span className="text-xl font-bold text-slate-900 tracking-tight">SaansSync</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Smart Respiratory Care</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-12">
                          <Link href="/" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-950 transition-colors">Documentation</Link>
                          <Link href="/" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-950 transition-colors">Privacy</Link>
                          <Link href="/" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-950 transition-colors">Contact</Link>
                    </div>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        &copy; 2026 SaansSync Protocol. Optimized Outcomes.
                    </div>
                </div>
            </footer>
        </div>
    )
}