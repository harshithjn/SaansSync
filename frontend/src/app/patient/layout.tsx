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

    // Skip layout for login page
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
            href: String(getDashboardRoute(authState.profile?.patient_data?.diagnosis?.primaryCategory)),
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
            <div className="min-h-screen bg-white flex items-center justify-center font-['Matter_Regular',sans-serif]">
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-[2rem] mx-auto border border-slate-100 shadow-sm animate-pulse">
                        <img src="/favicon.ico" alt="Logo" className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Setting up your workspace...</p>
                </div>
            </div>
        )
    }

    if (!authState.user || authState.role !== 'patient') {
        return null
    }

    return (
        <LanguageProvider>
            <div className="min-h-screen bg-white flex font-['Matter_Regular',sans-serif]">
                {/* Sidebar - Fixed and Non-scrollable */}
                <aside className="w-80 bg-white border-r border-slate-50 flex flex-col h-screen fixed z-40 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
                    {/* Brand Section */}
                    <div className="px-10 py-12">
                        <div className="flex items-center gap-4 group">
                           <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center transition-all group-hover:scale-110 duration-500 overflow-hidden shadow-sm">
                               <img src="/favicon.ico" alt="Logo" className="w-7 h-7 object-contain" />
                           </div>
                           <div className="flex flex-col">
                               <span className="text-2xl font-bold text-slate-900 tracking-tight leading-none">SaansSync</span>
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Online
                               </span>
                           </div>
                        </div>
                    </div>

                    {/* Navigation Engine */}
                    <div className="flex-1 px-6 overflow-y-auto no-scrollbar">
                        <nav className="space-y-2">
                            {navigationItems.map((item) => {
                                const IconComponent = item.icon
                                return (
                                    <Link key={item.name} href={item.href}>
                                        <div className={`
                                            flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group
                                            ${item.isActive
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-100'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                            }
                                        `}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.isActive ? 'bg-white/10 text-white shadow-inner shadow-white/20' : 'bg-transparent text-slate-200 group-hover:bg-white group-hover:shadow-sm group-hover:text-slate-950'}`}>
                                                    <IconComponent className="w-4 h-4" />
                                                </div>
                                                <span className="text-[11px] font-bold uppercase tracking-widest">{item.name}</span>
                                            </div>
                                            {item.isActive && <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40" />}
                                            {!item.isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-100 group-hover:text-slate-200 group-hover:translate-x-1 transition-all" />}
                                        </div>
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Identity Footer */}
                    <div className="p-8 border-t border-slate-50">
                        <div className="bg-slate-50 rounded-[2.5rem] p-6 mb-6 border border-slate-100/50 group transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-100 duration-700">
                             <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm relative overflow-hidden group-hover:scale-105 transition-all">
                                     <div className="absolute inset-0 bg-slate-950 opacity-0 group-hover:opacity-[0.03] transition-opacity" />
                                     <User className="w-6 h-6 text-slate-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate tracking-tight leading-none">
                                        {authState.profile?.full_name || 'Patient User'}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate mt-2 flex items-center gap-1.5">
                                        Patient Account
                                    </p>
                                </div>
                             </div>
                             
                             <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                <LanguageToggle />
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-950 cursor-pointer">
                                   <Bell className="w-3.5 h-3.5" />
                                </div>
                             </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between px-6 py-4 group bg-transparent hover:bg-rose-50 rounded-2xl transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                    <LogOut className="w-4 h-4 text-slate-200 group-hover:text-rose-500 transition-colors" />
                                </div>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-rose-600 transition-colors">Sign Out</span>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-slate-100 group-hover:bg-rose-100 transition-colors" />
                        </button>
                    </div>
                </aside>

                {/* Content Stream */}
                <main className="flex-1 ml-80 min-h-screen bg-white">
                    <div className="max-w-7xl mx-auto p-8">
                        {children}
                    </div>
                </main>
            </div>
        </LanguageProvider>
    )
}