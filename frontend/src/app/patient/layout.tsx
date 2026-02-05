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
    MessageSquare
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
    if (pathname === '/patient/login') {
        return (
            <LanguageProvider>
                {children}
            </LanguageProvider>
        )
    }

    const navigationItems = [
        {
            name: "Dashboard",
            href: getDashboardRoute(authState.profile?.patient_data?.diagnosis?.primaryCategory),
            icon: Home,
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
            isActive: pathname === `/patient/messages`
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
            icon: User,
            isActive: pathname === `/patient/settings`
        }
    ]

    const handleLogout = async () => {
        await signOut()
        router.push("/patient/login")
    }

    if (authState.loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!authState.user || authState.role !== 'patient') {
        return null // Will redirect to login via usePatientAuth
    }

    return (
        <LanguageProvider>
            <div className="min-h-screen bg-gray-50 flex">
                {/* Sidebar - Fixed and Non-scrollable */}
                <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                                    <Heart className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-semibold text-gray-900 text-sm">Patient Portal</span>
                            </div>
                            <LanguageToggle />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">ID: {authState.profile?.id || 'Loading...'}</p>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 px-3 py-4">
                        <nav className="space-y-1">
                            {navigationItems.map((item) => {
                                const IconComponent = item.icon
                                return (
                                    <Link key={item.name} href={item.href}>
                                        <div className={`
                                        flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
                                        ${item.isActive
                                                ? 'bg-green-600 text-white'
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

                    {/* Patient Profile & Logout - Fixed at bottom */}
                    <div className="px-3 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="px-3 py-2 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                    <User className="w-3 h-3 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                        {authState.profile?.full_name || 'Patient'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {authState.profile?.email || authState.profile?.phone || 'No contact info'}
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

                {/* Main Content - Offset by sidebar width */}
                <main className="flex-1 ml-64 overflow-auto">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </LanguageProvider>
    )
}