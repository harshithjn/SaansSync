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
    Stethoscope,
    MessageSquare,
    ClipboardList
} from "lucide-react"
import { useDoctorAuth } from '@/lib/auth-guard'

export function DoctorSidebar() {
    const router = useRouter()
    const pathname = usePathname()
    const authState = useDoctorAuth()

    // Get doctor ID directly from the auth profile, 
    // ensuring we don't depend on URL params that might be missing (e.g. in /messages)
    const doctorId = authState.profile?.id || authState.user?.id || ""

    const navigationItems = [
        {
            name: "Patients",
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
            name: "Analytics",
            href: `/doctor/dashboard/${doctorId}/analytics`,
            icon: BarChart3,
            isActive: pathname === `/doctor/dashboard/${doctorId}/analytics`
        },
        {
            name: "Export Data",
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
        const { signOutUser } = await import('@/lib/session-manager')
        await signOutUser()
        router.push('/login')
    }

    // If loading or not authorized yet (though layout protects this), show skeleton or nothing
    if (authState.loading) return null

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed top-0 left-0 z-40">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
                        <Stethoscope className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">SaansSync</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-3 py-4 overflow-y-auto">
                <nav className="space-y-1">
                    {navigationItems.map((item) => {
                        const IconComponent = item.icon
                        return (
                            <Link key={item.name} href={item.href}>
                                <div className={`
                  flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
                  ${item.isActive
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                    }
                `}>
                                    <IconComponent className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </div>
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Doctor Profile & Logout - Fixed at bottom */}
            <div className="px-3 py-4 border-t border-gray-200 bg-gray-50">
                <div className="px-3 py-2 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                                {authState.profile?.full_name || 'Doctor'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {authState.profile?.email || authState.user?.email || 'No contact info'}
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <LogOut className="w-3 h-3" />
                    <span>Sign out</span>
                </button>
            </div>
        </aside>
    )
}
