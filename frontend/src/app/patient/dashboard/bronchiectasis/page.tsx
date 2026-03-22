"use client"

import { usePatientAuth } from "@/lib/auth-guard"
import { Loader2 } from "lucide-react"
import PatientDashboardWrapper from "@/components/patient/PatientDashboardWrapper"

export default function BronchiectasisDashboard() {
    const authState = usePatientAuth()

    if (authState.loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 font-['Matter_Regular',sans-serif]">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-[2rem] border border-slate-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing Bronchiectasis Care Node...</p>
            </div>
        )
    }

    if (!authState.user || authState.role !== 'patient' || !authState.profile) {
        return null // Will redirect via usePatientAuth
    }

    return <PatientDashboardWrapper diseaseType="bronchiectasis" />
}