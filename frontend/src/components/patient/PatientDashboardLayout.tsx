"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
    User,
    Activity,
    Calendar,
    ChevronRight,
    ShieldCheck
} from 'lucide-react'

interface PatientDashboardLayoutProps {
    children: React.ReactNode
    patientName: string
    diagnosis: string
    patientId: string
    headless?: boolean
}

export function PatientDashboardLayout({
    children,
    patientName,
    diagnosis,
    patientId,
    headless = false
}: PatientDashboardLayoutProps) {

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good Morning'
        if (hour < 18) return 'Good Afternoon'
        return 'Good Evening'
    }

    if (headless) {
        return (
            <div className="animate-in fade-in duration-1000">
                {children}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {}
            <div className="border-b border-slate-200 pb-5">
                <div className="inline-flex items-center gap-2 font-mono text-[9px] text-slate-400 uppercase tracking-widest mb-3">
                    <Calendar className="w-3 h-3" />
                    {getGreeting()} • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2.5">
                        <h2 className="font-heading text-2xl font-semibold text-slate-900 tracking-tight">
                            {patientName || 'Patient'}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Active Care</span>
                            </div>
                             <div className="flex items-center gap-1.5 text-slate-400 font-medium uppercase tracking-widest text-[9px] font-mono">
                                <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                                ID: {patientId.slice(0, 8).toUpperCase()}
                             </div>
                             <div className="flex items-center gap-2 px-2.5 py-1 bg-teal-50 border border-teal-100">
                                <Activity className="w-3.5 h-3.5 text-teal-600" />
                                <span className="text-[9px] font-bold text-teal-700 uppercase tracking-widest">{diagnosis}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
                {children}
            </div>
        </div>
    )
}
