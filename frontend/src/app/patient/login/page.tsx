"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Shield, Users, Activity, Heart } from "lucide-react"
import { storeSession, getDashboardRoute } from "@/lib/auth-utils"
import { loginPatient } from "@/lib/database-service"
import { supabase } from "@/lib/supabase"
import { getPatientDataArray, initializeDemoPatients, getStoredPatients, forceInitializeDemoPatients } from "@/lib/patient-storage"
import { Header } from '@/components/common/Header'

export default function PatientLoginPage() {
    const router = useRouter()
    const [step, setStep] = useState<'mobile' | 'otp'>('mobile')
    const [mobileNumber, setMobileNumber] = useState("")
    const [otp, setOtp] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [otpSent, setOtpSent] = useState(false)

    // Initialize demo patients on component mount
    useEffect(() => {
        initializeDemoPatients()
        
        // Debug: Log existing patients
        setTimeout(() => {
            const patients = getStoredPatients()
            console.log('Current patients:', patients.length)
            patients.forEach(p => {
                console.log(`Patient: ${p.patientData.fullName} - Mobile: ${p.patientData.mobileNumber}`)
            })
        }, 1000)
    }, [])

    const formatMobileNumber = (input: string): string => {
        const digits = input.replace(/\D/g, '')
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
        if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }

    const handleMobileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            // Clean mobile number (remove formatting)
            const cleanMobile = mobileNumber.replace(/\D/g, '')

            if (cleanMobile.length < 10) {
                setError("Please enter a valid 10-digit mobile number")
                setIsLoading(false)
                return
            }

            // First check database for patients created by doctors
            try {
                const { data: dbPatients, error: dbError } = await supabase
                    .from('patient_profiles')
                    .select('*')
                
                if (!dbError && dbPatients) {
                    console.log('Database patients found:', dbPatients.length)
                    
                    // Check if mobile number exists in database patients
                    const dbPatient = dbPatients.find(p => {
                        const patientData = p.patient_data || {}
                        const dbMobile = patientData.mobile || p.phone || ''
                        const cleanDbMobile = dbMobile.replace(/\D/g, '')
                        return cleanDbMobile === cleanMobile
                    })
                    
                    if (dbPatient) {
                        console.log('Patient found in database:', dbPatient.full_name)
                        // Simulate OTP sending
                        setTimeout(() => {
                            setOtpSent(true)
                            setStep('otp')
                            setIsLoading(false)
                        }, 1000)
                        return
                    }
                }
            } catch (dbError) {
                console.log('Database check failed, falling back to localStorage')
            }

            // Fallback: Check localStorage for demo patients
            const allPatients = getStoredPatients()
            console.log('Searching for mobile:', cleanMobile)
            console.log('Available patients:', allPatients.map(p => ({
                name: p.patientData.fullName,
                mobile: p.patientData.mobileNumber
            })))

            const patient = allPatients.find(p => {
                const patientMobile = p.patientData.mobileNumber.replace(/\D/g, '')
                console.log(`Comparing ${patientMobile} with ${cleanMobile}`)
                return patientMobile === cleanMobile
            })

            if (!patient) {
                setError(`Mobile number ${cleanMobile} not found. Available numbers: ${allPatients.map(p => p.patientData.mobileNumber).join(', ')}`)
                setIsLoading(false)
                return
            }

            console.log('Patient found:', patient.patientData.fullName)

            // Simulate OTP sending (in real app, this would call an API)
            setTimeout(() => {
                setOtpSent(true)
                setStep('otp')
                setIsLoading(false)
            }, 1000)

        } catch (error) {
            console.error('Login error:', error)
            setError("An error occurred. Please try again.")
            setIsLoading(false)
        }
    }

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            // Fixed OTP validation (123456)
            if (otp !== "123456") {
                setError("Invalid OTP. Please enter 123456")
                setIsLoading(false)
                return
            }

            // Database login
            const cleanMobile = mobileNumber.replace(/\D/g, '')
            
            const allPatients = getStoredPatients()
            const foundPatient = allPatients.find(p => p.patientData.mobileNumber.replace(/\D/g, '') === cleanMobile)
            const patientEmail = foundPatient?.patientData?.emailId ?? `${cleanMobile}@demo.com`
            // Try backend patient auth first (Phase 1: Supabase-created patients)
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
            try {
                const res = await fetch(`${backendUrl}/api/auth/patient`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: patientEmail, password: 'patient123' })
                })
                const data = await res.json()
                if (data.success && data.session) {
                    storeSession(data.session)
                    router.push(getDashboardRoute(data.session.primaryDiagnosisCategory))
                    return
                }
            } catch (_) { /* fallback */ }

            const loginResult = await loginPatient(patientEmail, 'patient123')
            if (loginResult.success && loginResult.session) {
                storeSession(loginResult.session)
                router.push(getDashboardRoute(loginResult.session.primaryDiagnosisCategory))
                return
            }
            setError(loginResult.error || 'Login failed')
            setIsLoading(false)
            return

        } catch (error) {
            setError("An error occurred during login. Please try again.")
            setIsLoading(false)
        }
    }

    const handleBackToMobile = () => {
        setStep('mobile')
        setOtp("")
        setOtpSent(false)
        setError("")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
            <Header currentPage="login" />

            <div className="flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-6">
                                {step === 'mobile' ? (
                                    <Phone className="w-10 h-10 text-green-600" />
                                ) : (
                                    <Shield className="w-10 h-10 text-green-600" />
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Portal</h1>
                            <p className="text-gray-600">
                                {step === 'mobile'
                                    ? 'Enter your mobile number to continue'
                                    : 'Enter the OTP sent to your mobile'
                                }
                            </p>
                        </div>

                        {step === 'mobile' ? (
                            <form onSubmit={handleMobileSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="mobile" className="text-base font-medium text-gray-700">
                                        Mobile Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="mobile"
                                            type="tel"
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(formatMobileNumber(e.target.value))}
                                            placeholder="123-456-7890"
                                            className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                            required
                                            disabled={isLoading}
                                            maxLength={12}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Enter the mobile number registered with your doctor
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleOtpSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="otp" className="text-base font-medium text-gray-700">
                                        Enter OTP
                                    </label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="otp"
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="123456"
                                            className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 text-center text-lg tracking-widest"
                                            required
                                            disabled={isLoading}
                                            maxLength={6}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        OTP sent to {mobileNumber}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        Demo OTP: 123456
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Verifying...' : 'Verify & Login'}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBackToMobile}
                                        className="w-full h-12 text-base"
                                        disabled={isLoading}
                                    >
                                        Change Mobile Number
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Patient Portal Features Preview */}
                        <div className="mt-8 p-6 bg-green-50 rounded-xl">
                            <h3 className="font-semibold text-green-900 mb-4 text-center">Your Health Dashboard</h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
                                        <Activity className="w-5 h-5 text-green-600" />
                                    </div>
                                    <p className="text-xs text-green-700">Health Tracking</p>
                                </div>
                                <div>
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
                                        <Heart className="w-5 h-5 text-green-600" />
                                    </div>
                                    <p className="text-xs text-green-700">Medications</p>
                                </div>
                                <div>
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
                                        <Users className="w-5 h-5 text-green-600" />
                                    </div>
                                    <p className="text-xs text-green-700">Doctor Care</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500">
                                Need help? Contact your healthcare provider
                            </p>
                        </div>

                        {/* Debug Section for Testing */}
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2">Testing Information</h4>
                            <div className="text-xs text-blue-700 space-y-1">
                                <p><strong>Demo Mobile Numbers:</strong></p>
                                <p>• 9876543210 (John Doe - ILD)</p>
                                <p>• 9876543211 (Jane Smith - Asthma)</p>
                                <p>• 9876543212 (Mike Johnson - COPD)</p>
                                <p>• 9876543213 (Bob Wilson - Bronchiectasis)</p>
                                <p>• 9876543214 (Alice Brown - Post ICU)</p>
                                <p><strong>OTP:</strong> 123456</p>
                                <Button
                                    onClick={() => forceInitializeDemoPatients()}
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 text-xs"
                                >
                                    Reset Demo Patients
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}