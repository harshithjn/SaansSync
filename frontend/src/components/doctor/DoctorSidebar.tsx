"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    User,
    LogOut,
    Users,
    Bell,
    BarChart3,
    Settings,
    Download,
    Activity,
    MessageSquare,
    ShieldCheck,
    ChevronRight,
    Search
} from "lucide-react"
import { useDoctorAuth } from '@/lib/auth-guard'
import { useAuth } from '@/components/auth/AuthProvider'

export function DoctorSidebar() {
    const router = useRouter()
    const pathname = usePathname()
    const authState = useDoctorAuth()
    const { logout: signOut } = useAuth()

    const doctorId = authState.profile?.id || authState.user?.id || ""

    const navigationItems = [
        {
            name: "Overview",
            href: `/doctor/dashboard/${doctorId}`,
            icon: Users,
            isActive: pathname === `/doctor/dashboard/${doctorId}`
        },
        {
            name: "Alerts",
            href: `/doctor/dashboard/${doctorId}/alerts`,
            icon: Bell,
            isActive: pathname === `/doctor/dashboard/${doctorId}/alerts`
        },
        {
            name: "Trends",
            href: `/doctor/dashboard/${doctorId}/analytics`,
            icon: BarChart3,
            isActive: pathname === `/doctor/dashboard/${doctorId}/analytics`
        },
        {
            name: "Exports",
            href: `/doctor/dashboard/${doctorId}/export`,
            icon: Download,
            isActive: pathname === `/doctor/dashboard/${doctorId}/export`
        },
        {
            name: "Messages",
            href: `/doctor/messages`,
            icon: MessageSquare,
            isActive: pathname.includes('/messages')
        },
        {
            name: "Settings",
            href: `/doctor/dashboard/${doctorId}/settings`,
            icon: Settings,
            isActive: pathname === `/doctor/dashboard/${doctorId}/settings`
        }
    ]

    const handleLogout = async () => {
        await signOut()
        router.push('/')
    }

    if (authState.loading) return null

    return (
        <aside className="w-80 bg-white border-r border-slate-50 flex flex-col h-screen fixed top-0 left-0 z-40 font-['Matter_Regular',sans-serif] shadow-[1px_0_0_0_rgba(0,0,0,0.03)]">
            {/* Clinical Brand */}
            <div className="px-10 py-12">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center transition-all group-hover:scale-110 duration-500 overflow-hidden shadow-sm">
                        <img src="/favicon.ico" alt="Logo" className="w-7 h-7 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-slate-950 tracking-tighter leading-none">SaansSync</span>
                        <span className="text-[9px] text-purple-600 font-bold uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
                             <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                             Medical Portal
                        </span>
                    </div>
                </Link>
            </div>

            {/* Global Search Interface */}
            <div className="px-8 mb-10">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-950 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search patients..."
                        className="w-full h-12 bg-slate-50 rounded-2xl pl-12 pr-4 text-[11px] font-bold tracking-tight text-slate-950 border-none outline-none focus:ring-4 focus:ring-slate-50 transition-all placeholder:text-slate-200"
                    />
                </div>
            </div>

            {/* Primary Navigation */}
            <div className="flex-1 px-6 overflow-y-auto no-scrollbar">
                <nav className="space-y-2">
                    {navigationItems.map((item) => {
                        const IconComponent = item.icon
                        return (
                            <Link key={item.name} href={item.href}>
                                <div className={`
                                    flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-500 group
                                    ${item.isActive
                                        ? 'bg-slate-950 text-white shadow-2xl shadow-slate-200 scale-[1.02]'
                                        : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
                                    }
                                `}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.isActive ? 'bg-white/10 text-white shadow-inner shadow-white/20' : 'bg-transparent text-slate-200 group-hover:bg-white group-hover:shadow-sm group-hover:text-slate-950'}`}>
                                            <IconComponent className="w-4 h-4" />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider">{item.name}</span>
                                    </div>
                                    {item.isActive && <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40" />}
                                    {!item.isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-100 group-hover:text-slate-200 group-hover:translate-x-1 transition-all" />}
                                </div>
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Operator Identity Area */}
            <div className="p-8 border-t border-slate-50">
                <div className="bg-slate-50 rounded-[2.5rem] p-6 mb-6 border border-slate-100/50 group transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-100 duration-700">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm relative overflow-hidden group-hover:scale-105 transition-all">
                             <div className="absolute inset-0 bg-slate-950 opacity-0 group-hover:opacity-[0.03] transition-opacity" />
                             <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${authState.profile?.full_name || 'Doctor'}`} 
                                alt="Avatar" 
                                className="w-10 h-10 object-contain"
                             />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-slate-950 truncate tracking-tight leading-none group-hover:text-purple-600 transition-colors">
                                {authState.profile?.full_name || 'Doctor'}
                            </p>
                            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em] truncate mt-2 flex items-center gap-1.5">
                                <ShieldCheck className="w-3 h-3" />
                                Verified Profile
                            </p>
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
    )
}
