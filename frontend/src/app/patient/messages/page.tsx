"use client"

import PatientChat from "@/components/patient/PatientChat"
import { MessageSquare } from "lucide-react"

export default function PatientMessagesPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000">
            {}
            <div className="space-y-4 border-b border-slate-50 pb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100/50">
                    <MessageSquare className="w-3 h-3" />
                    Secure Care Transmission
                </div>
                <h1 className="text-5xl font-black text-slate-950 tracking-tighter leading-none">Care Messages</h1>
                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                    End-to-End Encrypted Clinical Channel
                </p>
            </div>

            <PatientChat />
        </div>
    )
}
