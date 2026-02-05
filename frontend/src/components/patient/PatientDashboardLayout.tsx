
import React from 'react'
import { DashboardCard } from '@/components/ui/DashboardCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    User,
    Activity,
    Wind,
    Heart,
    AlertTriangle,
    Clock,
    LogOut,
    Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PatientDashboardLayoutProps {
    children: React.ReactNode
    patientName: string
    diagnosis: string
    patientId: string
    lastSyncTime?: string
    showMobileMenu?: boolean
    onToggleMobileMenu?: () => void
    onLogout?: () => void
    headless?: boolean
}

export function PatientDashboardLayout({
    children,
    patientName,
    diagnosis,
    patientId,
    lastSyncTime,
    onLogout,
    onToggleMobileMenu,
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
            <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                {children}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Top Navbar */}
            <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Mobile Menu Button - Visible only on mobile */}
                            <button onClick={onToggleMobileMenu} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md">
                                <Menu className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-2">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <Activity className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-slate-900 leading-none">SaansSync</h1>
                                    <span className="text-xs text-slate-500 font-medium tracking-wide">PATIENT PORTAL</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs text-slate-600 font-medium">System Active</span>
                            </div>

                            {onLogout && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onLogout}
                                    className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Hero Section */}
                <div className="grid gap-6 md:grid-cols-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-primary font-medium mb-1">
                                <span className="bg-primary/10 px-2 py-0.5 rounded text-xs">{getGreeting()}</span>
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                                {patientName || 'Patient'}
                            </h2>
                            <div className="flex items-center gap-3 mt-2 text-slate-500 text-sm">
                                <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />
                                    ID: {patientId}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="flex items-center gap-1 font-medium text-slate-700">
                                    <Activity className="w-3.5 h-3.5" />
                                    Diagnosis: {diagnosis}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Slot */}
                <div className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                    {children}
                </div>
            </main>
        </div>
    )
}
