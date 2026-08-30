"use client"

import { Header } from '@/components/common/Header'
import { Mail, Phone, MapPin, Send, MessageCircle, ArrowUpRight, Wind, ShieldCheck, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { toast } from '@/lib/toast'
import Link from 'next/link'

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        toast.success('Your message has been sent.')
        setFormData({ name: '', email: '', subject: '', message: '' })
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Header currentPage="contact" />

            <main className="container mx-auto px-8 py-32">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-32 items-start">
                        {}
                        <div className="space-y-16">
                            <div>
                                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-teal-50 text-teal-600 text-[10px] font-bold uppercase tracking-widest mb-10 border border-teal-100 shadow-sm">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Get in Touch
                                </div>
                                <h1 className="text-6xl md:text-7xl font-bold text-slate-900 tracking-tight mb-10 leading-[0.9]">
                                    Contact<br />
                                    Support.
                                </h1>
                                <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-md">
                                    Our team is here to help you with any questions about using SaansSync.
                                </p>
                            </div>

                            <div className="space-y-10">
                                <div className="group border-b border-slate-100 pb-10 cursor-pointer transition-all hover:translate-x-2">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Us</h3>
                                        <ArrowUpRight className="w-5 h-5 text-slate-200 group-hover:text-teal-600 transition-all" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900 tracking-tight">contact@harshithj.me</p>
                                </div>

                                <div className="p-8 bg-teal-600 rounded-[2.5rem] text-white overflow-hidden relative group">
                                    <h3 className="text-[10px] font-bold text-teal-100 uppercase tracking-widest mb-4 relative z-10">Care HQ</h3>
                                    <p className="text-lg font-bold tracking-tight leading-snug relative z-10">
                                        Empowering respiratory health<br />
                                        across the nation.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {}
                        <div className="bg-white rounded-[4rem] p-12 md:p-16 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.05)] border border-slate-50 relative">
                             <div className="absolute -top-10 -right-10 w-40 h-40 bg-slate-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
                             <div className="mb-12">
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Send a Message</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Tell us how we can assist you today.</p>
                             </div>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Name</label>
                                        <Input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="John Doe"
                                            required
                                            className="h-14 bg-slate-50 border-none rounded-xl px-6 font-bold text-slate-900 placeholder:text-slate-200 focus-visible:ring-slate-100 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Email</label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            placeholder="john@example.com"
                                            required
                                            className="h-14 bg-slate-50 border-none rounded-xl px-6 font-bold text-slate-900 placeholder:text-slate-200 focus-visible:ring-slate-100 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">How can we help?</label>
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => handleInputChange('message', e.target.value)}
                                            placeholder="Tell us what you need..."
                                            required
                                            rows={5}
                                            className="w-full p-6 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 placeholder:text-slate-200 focus:ring-4 focus:ring-slate-50 transition-all resize-none outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg tracking-tight shadow-xl shadow-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                                >
                                    Send Message
                                    <Send className="w-5 h-5" />
                                </Button>
                                <div className="flex items-center justify-center gap-3 text-slate-300">
                                    <ShieldCheck className="w-4 h-4" />
                                    <p className="text-[9px] font-bold uppercase tracking-widest">Your information is secure and private.</p>
                                </div>
                            </form>
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
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        &copy; 2026 SaansSync Protocol. Optimized Outcomes.
                    </div>
                </div>
            </footer>
        </div>
    )
}