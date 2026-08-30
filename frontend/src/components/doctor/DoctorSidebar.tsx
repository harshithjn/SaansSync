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
        <aside className="w-64 bg-slate-950 text-white flex flex-col h-screen fixed top-0 left-0 z-40">
            {}
            <div className="px-5 py-6 border-b border-white/10">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 bg-white flex items-center justify-center overflow-hidden">
                        <img src="/favicon.ico" alt="Logo" className="w-5 h-5 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-heading text-sm font-semibold tracking-tight leading-none">SaansSync</span>
                        <span className="font-mono text-[8px] text-teal-400 uppercase tracking-[0.25em] mt-1 flex items-center gap-1.5">
                             <div className="w-1 h-1 rounded-full bg-teal-400 animate-pulse" />
                             Medical Portal
                        </span>
                    </div>
                </Link>
            </div>

            {}
            <div className="px-4 py-4 border-b border-white/10">
                <div className="relative group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search patients..."
                        className="w-full h-8 bg-white/5 border border-white/10 pl-8 pr-3 text-[10px] font-medium tracking-tight text-white outline-none focus:border-teal-500/50 transition-all placeholder:text-slate-500"
                    />
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
                                        <span className="font-mono text-[10px] uppercase tracking-wider">{item.name}</span>
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
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                             <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate tracking-tight leading-none">
                                {authState.profile?.fullName || 'Doctor'}
                            </p>
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
    )
}
