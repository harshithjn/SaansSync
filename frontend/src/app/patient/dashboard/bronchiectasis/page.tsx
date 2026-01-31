"use client"

import { usePatientAuth } from "@/lib/auth-guard"
import CleanBronchiectasisDashboard from "@/components/patient/CleanBronchiectasisDashboard"

export default function BronchiectasisDashboard() {
    const authState = usePatientAuth()

    if (authState.loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!authState.user || authState.role !== 'patient' || !authState.profile) {
        return null // Will redirect via usePatientAuth
    }

    return <CleanBronchiectasisDashboard patientId={authState.profile.id} />
}