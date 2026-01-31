"use client"

import { usePatientAuth } from "@/lib/auth-guard"
import PatientDashboardWrapper from "@/components/patient/PatientDashboardWrapper"

export default function ILDDashboard() {
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

    if (!authState.user || authState.role !== 'patient') {
        return null // Will redirect via usePatientAuth
    }

    return <PatientDashboardWrapper diseaseType="ild" />
}