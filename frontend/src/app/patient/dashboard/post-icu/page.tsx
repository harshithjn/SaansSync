"use client"

import { usePatientAuth } from "@/lib/auth-guard"
import { Loader2 } from "lucide-react"
import PatientDashboardWrapper from "@/components/patient/PatientDashboardWrapper"

export default function PostIcuDashboard() {
    const authState = usePatientAuth()

    if (authState.loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-[2rem] border border-slate-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing Post-ICU Care Node...</p>
            </div>
        )
    }

    if (!authState.user || authState.role !== 'patient' || !authState.profile) {
        return null
    }

    return <PatientDashboardWrapper diseaseType="post-infection" />
}