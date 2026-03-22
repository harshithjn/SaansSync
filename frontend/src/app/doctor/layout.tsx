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
            <div className="min-h-screen bg-white flex items-center justify-center font-['Matter_Regular',sans-serif]">
                <div className="flex flex-col items-center gap-8">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-slate-50 rounded-[2.5rem] animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Activity className="w-8 h-8 text-slate-900 animate-bounce" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-950">Portal</p>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300">Connecting...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!authState.user || !authState.approved) return null

    return (
        <div className="min-h-screen bg-[#fafafa] flex font-['Matter_Regular',sans-serif]">
            <DoctorSidebar />
            <main className="flex-1 ml-80 overflow-auto">
                <div className="p-12 relative">
                    {/* Background Decorative Element */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50 rounded-full blur-3xl opacity-50 -translate-y-48 translate-x-48 pointer-events-none" />
                    
                    <div className="relative z-10">
                        {children}
                    </div>

                    <footer className="mt-24 pt-12 border-t border-slate-100/50 flex flex-col md:flex-row justify-between items-center gap-6 pb-12">
                         <div className="flex flex-col items-end">
                            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">Secure Medical Portal Active</p>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-[9px] font-bold text-slate-200 uppercase tracking-widest hover:text-slate-400 cursor-pointer transition-colors">Security</span>
                                <span className="text-[9px] font-bold text-slate-200 uppercase tracking-widest hover:text-slate-400 cursor-pointer transition-colors">Support</span>
                            </div>
                        </div>
                         <div className="flex items-center gap-10">
                            <span className="text-[9px] font-bold text-slate-200 uppercase tracking-widest hover:text-slate-400 cursor-pointer transition-colors">Documentation</span>
                            <span className="text-[9px] font-bold text-slate-200 uppercase tracking-widest hover:text-slate-400 cursor-pointer transition-colors">Safety Matrix</span>
                         </div>
                    </footer>
                </div>
            </main>
        </div>
    )
}
