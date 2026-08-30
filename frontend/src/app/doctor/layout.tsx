"use client"

import { ReactNode } from "react"
import { DoctorSidebar } from "@/components/doctor/DoctorSidebar"
import { useDoctorAuth } from "@/lib/auth-guard"
import { Loader2, ShieldCheck, Activity } from "lucide-react"

export default function DoctorLayout({
    children,
}: {
    children: ReactNode
}) {
    const authState = useDoctorAuth()

    if (authState.loading) {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-14 h-14 border-2 border-slate-900 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-teal-600 animate-pulse" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-950">Portal</p>
                        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400">Connecting...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!authState.user || !authState.approved) return null

    return (
        <div className="min-h-screen bg-[#faf9f6] flex">
            <DoctorSidebar />
            <main className="flex-1 ml-64 overflow-auto">
                <div className="p-8 relative">
                    <div className="relative z-10">
                        {children}
                    </div>

                    <footer className="mt-16 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 pb-8">
                         <div className="flex flex-col items-end">
                            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400">Secure Medical Portal Active</p>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="font-mono text-[9px] text-slate-300 uppercase tracking-widest hover:text-slate-500 cursor-pointer transition-colors">Security</span>
                                <span className="font-mono text-[9px] text-slate-300 uppercase tracking-widest hover:text-slate-500 cursor-pointer transition-colors">Support</span>
                            </div>
                        </div>
                         <div className="flex items-center gap-10">
                            <span className="font-mono text-[9px] text-slate-300 uppercase tracking-widest hover:text-slate-500 cursor-pointer transition-colors">Documentation</span>
                            <span className="font-mono text-[9px] text-slate-300 uppercase tracking-widest hover:text-slate-500 cursor-pointer transition-colors">Safety Matrix</span>
                         </div>
                    </footer>
                </div>
            </main>
        </div>
    )
}
