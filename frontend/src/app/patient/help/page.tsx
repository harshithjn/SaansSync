"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { 
    HelpCircle, 
    Phone, 
    Mail, 
    AlertTriangle, 
    Clock, 
    ShieldCheck, 
    MessageCircle, 
    BookOpen, 
    Wrench,
    ArrowRight,
    Zap,
    Heart,
    LifeBuoy
} from "lucide-react"

export default function PatientHelpPage() {
    const handleContactClick = (method: string) => {
        switch (method) {
            case 'phone':
                window.location.href = 'tel:+1-555-123-4567'
                break
            case 'email':
                window.location.href = 'mailto:support@clinic.com'
                break
            default:
                toast.info(`Protocol Initiated: ${method}`)
        }
    }

    return (
        <div className="space-y-16 font-['Matter_Regular',sans-serif] animate-in fade-in duration-1000 max-w-6xl mx-auto pb-24">
            {/* Clinical Header */}
            <div className="space-y-4 border-b border-slate-50 pb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100/50">
                    <LifeBuoy className="w-3 h-3" />
                    Support Core Interface
                </div>
                <h1 className="text-5xl font-black text-slate-950 tracking-tighter leading-none">Support & Resources</h1>
                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                    Clinical Assistance & Operational Documentation
                </p>
            </div>

            {/* Emergency Critical Section */}
            <Card className="p-12 border-none bg-rose-50 rounded-[4rem] relative overflow-hidden group shadow-2xl shadow-rose-100/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 opacity-[0.03] rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-all duration-1000" />
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 relative z-10">
                    <div className="space-y-6 max-w-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-rose-100 shadow-sm">
                                <AlertTriangle className="w-7 h-7 text-rose-500 animate-pulse" />
                            </div>
                            <h2 className="text-3xl font-black text-rose-950 tracking-tighter decoration-rose-500 underline underline-offset-8">Critical Emergency</h2>
                        </div>
                        <p className="text-sm font-bold text-rose-900 leading-relaxed italic border-l-4 border-rose-200 pl-6">
                            If you are experiencing a life-threatening medical emergency, call <span className="text-2xl font-black mx-1">911</span> immediately. Clinical portal latency should not delay acute intervention.
                        </p>
                    </div>
                    <Button 
                        onClick={() => window.location.href = 'tel:911'}
                        className="h-20 px-12 rounded-[2rem] bg-rose-600 hover:bg-rose-700 text-white font-black text-xl uppercase tracking-widest transition-all shadow-2xl shadow-rose-200 group"
                    >
                        INITIATE 911 CALL
                    </Button>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Infrastructure */}
                <Card className="p-12 border-none bg-white shadow-sm border border-slate-50 rounded-[3.5rem] relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 shadow-sm border border-purple-100/50">
                            <Phone className="w-5 h-5" />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Primary Clinical Uplink</h3>
                    </div>
                    <div className="space-y-10">
                        <div className="space-y-2">
                            <p className="text-4xl font-black text-slate-950 tracking-tighter">+1 (555) 123-4567</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                MON-FRI 08:00 - 17:00 • SAT 09:00 - 13:00
                            </p>
                        </div>
                        <Button 
                            onClick={() => handleContactClick('phone')}
                            className="w-full h-16 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all group shadow-xl"
                        >
                            Establish Voice Link
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </Card>

                {/* Secure Messaging */}
                <Card className="p-12 border-none bg-white shadow-sm border border-slate-50 rounded-[3.5rem] relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100/50">
                            <Mail className="w-5 h-5" />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Asynchronous Support</h3>
                    </div>
                    <div className="space-y-10">
                        <div className="space-y-2">
                            <p className="text-4xl font-black text-slate-950 tracking-tighter">support@clinic.com</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                24-48H RECOVERY WINDOW • NON-URGENT ONLY
                            </p>
                        </div>
                        <Button 
                            variant="ghost" 
                            onClick={() => handleContactClick('email')}
                            className="w-full h-16 rounded-2xl border border-slate-100 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 hover:text-slate-950 hover:bg-slate-50 transition-all"
                        >
                            Transmit Digital Inquiry
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Support Matrix */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-slate-300" />
                    </div>
                    <h2 className="text-xl font-black text-slate-950 tracking-tight uppercase tracking-widest text-xs">Knowledge Repository</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: "Refill Protocols", desc: "Guidelines for requesting therapeutic replenishment 48h prior to expiration." },
                        { title: "Appointment Cycle", desc: "Scheduling mechanisms for baseline clinical reviews and acute evaluations." },
                        { title: "Result Archive", desc: "Access procedures for formal health documentation and diagnostic telemetry." },
                        { title: "Credential Recovery", desc: "Self-service and administrative paths for portal access restoration." }
                    ].map((faq, i) => (
                        <div key={i} className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-2xl hover:shadow-slate-100 transition-all duration-700">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                <div className="text-[10px] font-black text-slate-200">{String(i+1).padStart(2, '0')}</div>
                            </div>
                            <h4 className="font-black text-slate-950 tracking-tight mb-3 text-lg leading-none">{faq.title}</h4>
                            <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{faq.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Technical Ops Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                <div className="md:col-span-2">
                    <Card className="p-12 border-none bg-slate-950 text-white rounded-[3.5rem] relative overflow-hidden group h-full">
                        <div className="absolute inset-0 bg-purple-500 opacity-0 group-hover:opacity-[0.03] transition-opacity" />
                        <div className="flex items-center gap-4 mb-12">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Technical Operations</h3>
                        </div>
                        <div className="space-y-8">
                            <p className="text-2xl font-black tracking-tight leading-relaxed max-w-xl">
                                System malfunctions or interface discrepancies should be reported to the Clinical Systems Node.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Support Phone</p>
                                    <p className="text-lg font-black">+1 (555) 123-4569</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Support Email</p>
                                    <p className="text-lg font-black truncate">tech-ops@clinic.com</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-12 border-none bg-emerald-50 rounded-[3.5rem] h-full flex flex-col justify-between group">
                    <div className="space-y-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm group-hover:rotate-12 transition-transform">
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-emerald-950 tracking-tighter leading-none">Security Core</h3>
                        <p className="text-[11px] text-emerald-800 font-bold leading-relaxed">
                            RSA-4096 Encryption Active. All telemetry transmissions are compliant with international HIPAA-V3 security standards.
                        </p>
                    </div>
                </Card>
            </div>

            {/* Protocol Footer */}
            <div className="flex items-center justify-center gap-8 pt-12 opacity-20 hover:opacity-100 transition-opacity">
                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED PATIENT PORTAL V3.0.4
                </p>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em]">SYSTEM_STABLE_LOADED</p>
            </div>
        </div>
    )
}