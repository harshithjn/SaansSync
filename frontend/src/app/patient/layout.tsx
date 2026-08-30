"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
    User,
    LogOut,
    Home,
    FileText,
    Pill,
    HelpCircle,
    Heart,
    MessageSquare,
    ChevronRight,
    ShieldCheck,
    Languages,
    Bell,
    Settings,
    LayoutDashboard
} from "lucide-react"
import { usePatientAuth } from "@/lib/auth-guard"
import { signOut } from "@/lib/auth-service"
import { getDashboardRoute } from "@/lib/auth-types"
import { LanguageProvider, LanguageToggle } from "@/lib/language-context"

export default function PatientLayout({
    children,
}: {
    children: ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const authState = usePatientAuth()

    if (pathname === '/sign-in') {
        return (
            <LanguageProvider>
                {children}
            </LanguageProvider>
        )
    }

    const navigationItems = [
        {
            name: "Dashboard",
            href: String(getDashboardRoute(authState.profile?.patientData?.diagnosis?.primaryCategory)),
            icon: LayoutDashboard,
            isActive: pathname.includes('/patient/dashboard/') && !pathname.includes('/reports') && !pathname.includes('/medications') && !pathname.includes('/help')
        },
        {
            name: "My Reports",
            href: `/patient/reports`,
            icon: FileText,
            isActive: pathname === `/patient/reports`
        },
        {
            name: "Messages",
            href: `/patient/messages`,
            icon: MessageSquare,
            isActive: pathname.includes('/messages')
        },
        {
            name: "Help & Support",
            href: `/patient/help`,
            icon: HelpCircle,
            isActive: pathname === `/patient/help`
        },
        {
            name: "Settings",
            href: `/patient/settings`,
            icon: Settings,
            isActive: pathname === `/patient/settings`
        }
    ]

    const handleLogout = async () => {
        await signOut()
        router.push("/sign-in")
    }

    if (authState.loading) {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-14 h-14 bg-slate-950 flex items-center justify-center mx-auto animate-pulse">
                        <img src="/favicon.ico" alt="Logo" className="w-7 h-7 opacity-90" />
                    </div>
                    <p className="font-mono text-xs text-slate-400 uppercase tracking-widest">Setting up your workspace...</p>
                </div>
            </div>
        )
    }

    if (!authState.user || authState.role !== 'patient') {
        return null
    }

    return (
        <LanguageProvider>
            <div className="min-h-screen bg-[#faf9f6] flex">
                {}
                <aside className="w-64 bg-slate-950 text-white flex flex-col h-screen fixed z-40">
                    {}
                    <div className="px-5 py-6 border-b border-white/10">
                        <div className="flex items-center gap-2.5 group">
                           <div className="w-8 h-8 bg-white flex items-center justify-center overflow-hidden">
                               <img src="/favicon.ico" alt="Logo" className="w-5 h-5 object-contain" />
                           </div>
                           <div className="flex flex-col">
                               <span className="font-heading text-sm font-semibold tracking-tight leading-none">SaansSync</span>
                               <span className="font-mono text-[8px] text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Online
                               </span>
                           </div>
                        </div>
                    </div>

                    {}
                    <div className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar">
                        <nav className="space-y-0.5">
                            {navigationItems.map((item) => {
                                const IconComponent = item.icon
                                return (
                                    <Link key={item.name} href={item.href}>
                                        <div className={`
                                            flex items-center justify-between px-3 py-2.5 transition-all duration-300 group border-l-2
                                            ${item.isActive
                                                ? 'bg-white/[0.06] border-teal-400 text-white'
                                                : 'border-transparent text-slate-400 hover:bg-white/[0.03] hover:text-white'
                                            }
                                        `}>
                                            <div className="flex items-center gap-3">
                                                <IconComponent className={`w-3.5 h-3.5 ${item.isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                                <span className="font-mono text-[10px] uppercase tracking-widest">{item.name}</span>
                                            </div>
                                            {!item.isActive && <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />}
                                        </div>
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {}
                    <div className="p-4 border-t border-white/10">
                        <div className="border border-white/10 p-3 mb-2">
                             <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                     <User className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white truncate tracking-tight leading-none">
                                        {authState.profile?.fullName || 'Patient User'}
                                    </p>
                                    <p className="font-mono text-[8px] text-slate-500 uppercase tracking-widest truncate mt-1.5">
                                        Patient Account
                                    </p>
                                </div>
                             </div>

                             <div className="flex items-center justify-between border-t border-white/10 pt-3">
                                <LanguageToggle />
                                <div className="w-6 h-6 bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                                   <Bell className="w-3 h-3" />
                                </div>
                             </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between px-3 py-2.5 group bg-transparent hover:bg-rose-500/10 transition-all duration-300"
                        >
                            <div className="flex items-center gap-3">
                                <LogOut className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 transition-colors" />
                                <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest group-hover:text-rose-400 transition-colors">Sign Out</span>
                            </div>
                        </button>
                    </div>
                </aside>

                {}
                <main className="flex-1 ml-64 min-h-screen bg-[#faf9f6]">
                    <div className="max-w-6xl mx-auto p-6">
                        {children}
                    </div>
                </main>
            </div>
        </LanguageProvider>
    )
}