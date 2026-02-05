"use client"

import { ReactNode } from "react"
import { DoctorSidebar } from "@/components/doctor/DoctorSidebar"
import { useDoctorAuth } from "@/lib/auth-guard"

export default function DoctorLayout({
    children,
}: {
    children: ReactNode
}) {
    const authState = useDoctorAuth()

    // Optional: You can handle global loading/auth states here too, 
    // but useDoctorAuth already redirects if unauthorized.

    if (authState.loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // If not approved/authenticated, the hook redirects, so we can render null or minimal state
    if (!authState.user || !authState.approved) return null

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <DoctorSidebar />
            <main className="flex-1 ml-64 overflow-auto">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
