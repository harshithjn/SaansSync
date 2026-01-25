"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthSession } from "@/lib/auth-types"
import { getStoredSession, clearSession } from "@/lib/auth-utils"

export default function PatientDashboardLayout({
    children,
}: {
    children: ReactNode
}) {
    const router = useRouter()
    const [session, setSession] = useState<AuthSession | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const storedSession = getStoredSession()
        if (!storedSession || storedSession.role !== "PATIENT") {
            router.push("/patient/login")
            return
        }
        setSession(storedSession)
        setIsLoading(false)
    }, [router])

    const handleLogout = () => {
        clearSession()
        router.push("/patient/login")
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return null // Will redirect to login
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-semibold text-gray-900">
                                Patient Portal
                            </h1>
                            <span className="text-sm text-gray-500">
                                ID: {session.patientId}
                            </span>
                        </div>

                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">
                                Welcome, {session.email.split('@')[0]}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <nav className="bg-white rounded-lg shadow-sm p-4 space-y-2">
                            <Link href={`/patient/dashboard/${getDashboardSlug(session.primaryDiagnosisCategory || 'ild')}`}>
                                <Button variant="ghost" className="w-full justify-start text-left">
                                    🏠 Dashboard
                                </Button>
                            </Link>

                            <Link href={`/patient/reports`}>
                                <Button variant="ghost" className="w-full justify-start text-left">
                                    📊 My Reports
                                </Button>
                            </Link>

                            <Link href={`/patient/medications`}>
                                <Button variant="ghost" className="w-full justify-start text-left">
                                    💊 My Medications
                                </Button>
                            </Link>

                            <Link href={`/patient/help`}>
                                <Button variant="ghost" className="w-full justify-start text-left">
                                    ❓ Help & Contact
                                </Button>
                            </Link>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}

// Helper function to get dashboard slug from diagnosis category
function getDashboardSlug(category: string): string {
    switch (category) {
        case "Interstitial Lung Disease (ILD)":
            return "ild"
        case "Bronchial Asthma":
            return "asthma"
        case "COPD (Chronic Obstructive Pulmonary Disease)":
            return "oad"
        case "Obstructive Airway Disease (OAD)":
            return "oad"
        case "Bronchiectasis":
            return "bronchiectasis"
        case "Post ICU Recovery":
            return "post-icu"
        default:
            return "ild" // Default to ILD dashboard
    }
}