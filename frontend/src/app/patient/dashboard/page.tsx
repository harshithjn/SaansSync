"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePatientAuth } from "@/lib/auth-guard"
import { getDashboardRoute } from "@/lib/auth-types"

import { Loader2 } from "lucide-react"

export default function PatientDashboardIndex() {
  const router = useRouter()
  const authState = usePatientAuth()

  useEffect(() => {
    if (!authState.loading && authState.user && authState.role === 'patient') {
      const diseaseType = authState.profile?.patient_data?.diagnosis?.primaryCategory || 
                         authState.profile?.diseaseType || 
                         "Interstitial Lung Disease (ILD)"
      
      const route = getDashboardRoute(diseaseType)
      router.push(route)
    }
  }, [authState, router])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 font-['Matter_Regular',sans-serif]">
        <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-[2rem] border border-slate-100 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Resolving Patient Dashboard Node...</p>
    </div>
  )
}
