"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { Loader2 } from "lucide-react"

export default function PatientPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to patient login page
    router.push("/sign-in")
  }, [router])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 font-['Matter_Regular',sans-serif]">
        <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-[2rem] border border-slate-100 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Redirecting to Clinical Auth Node...</p>
    </div>
  )
}
