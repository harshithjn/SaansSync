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
        <div className="space-y-16 font-['Matter_Regular',sans-serif]">
            {/* Hero / Welcome Section */}
            <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6 border border-slate-100">
                    <Calendar className="w-3.5 h-3.5" />
                    {getGreeting()} • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                            {patientName || 'Patient'}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
                             <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Active Care</span>
                            </div>
                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                             <div className="flex items-center gap-2 text-slate-400 font-medium uppercase tracking-widest text-[10px]">
                                <ShieldCheck className="w-4 h-4 text-slate-200" />
                                ID: {patientId.slice(0, 8).toUpperCase()}
                             </div>
                             <div className="w-1 h-1 bg-slate-200 rounded-full" />
                             <div className="flex items-center gap-3 px-4 py-2 bg-purple-50/50 rounded-xl border border-purple-100/50">
                                <Activity className="w-4 h-4 text-purple-500" />
                                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">{diagnosis}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Element */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 -z-10" />
            </div>

            {/* Dashboard Content Stream */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
                {children}
            </div>
        </div>
    )
}
