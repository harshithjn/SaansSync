"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthSession } from "@/lib/auth-types"
import { getStoredSession } from "@/lib/auth-utils"
import CleanPostInfectionDashboard from "@/components/patient/CleanPostInfectionDashboard"

export default function PostICUDashboard() {
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return null
    }

    return <CleanPostInfectionDashboard patientId={session.patientId} />
}