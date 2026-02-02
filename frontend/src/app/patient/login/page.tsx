"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Shield, Users, Activity, Heart } from "lucide-react"
import { signInPatientWithOTP, verifyPatientOTP, debugPatientPhoneNumbers, findPatientByPhone } from "@/lib/auth-service"
import { getDashboardRoute } from "@/lib/auth-types"
import { Header } from '@/components/common/Header'

export default function PatientLoginPage() {
    const router = useRouter()
    const [step, setStep] = useState<'mobile' | 'otp'>('mobile')
    const [mobileNumber, setMobileNumber] = useState("")
    const [otp, setOtp] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

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
            // Debug: Check what's in the database
            await debugPatientPhoneNumbers()
            
            // Clean mobile number (remove formatting)
            const cleanMobile = mobileNumber.replace(/\D/g, '')
            console.log('🔍 Login attempt - Original input:', mobileNumber)
            console.log('🔍 Login attempt - Clean mobile:', cleanMobile)
            console.log('🔍 Login attempt - Mobile length:', cleanMobile.length)

            if (cleanMobile.length < 10) {
                setError("Please enter a valid 10-digit mobile number")
                setIsLoading(false)
                return
            }

            // Manual search to debug
            const searchResult = await findPatientByPhone(cleanMobile)
            console.log('🔍 Manual search result:', searchResult)

            // Send OTP using real auth service with timeout
            const otpPromise = signInPatientWithOTP(cleanMobile)
            const timeoutPromise = new Promise<{ success: boolean; error?: string }>((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out. Please check your internet connection and try again.')), 15000)
            })

            const result = await Promise.race([otpPromise, timeoutPromise]) as { success: boolean; error?: string }
            
            if (result.success) {
                setStep('otp')
                setIsLoading(false)
            } else {
                setError(result.error || 'Failed to send OTP')
                setIsLoading(false)
            }

        } catch (error) {
            console.error('Login error:', error)
            const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again."
            setError(errorMessage)
            setIsLoading(false)
        }
    }

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const cleanMobile = mobileNumber.replace(/\D/g, '')
            
            // Verify OTP using real auth service
            const result = await verifyPatientOTP(cleanMobile, otp)
            
            if (result.success && result.patientProfile) {
                // Get dashboard route from patient data
                const diagnosis = result.patientProfile.patient_data?.diagnosis?.primaryCategory
                const dashboardRoute = getDashboardRoute(diagnosis)
                router.push(dashboardRoute)
            } else {
                setError(result.error || 'OTP verification failed')
            }

        } catch (error) {
            console.error('OTP verification error:', error)
            setError("An error occurred during login. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleBackToMobile = () => {
        setStep('mobile')
        setOtp("")
        setError("")
    }

    const handleResendOTP = async () => {
        setIsLoading(true)
        setError("")

        try {
            const cleanMobile = mobileNumber.replace(/\D/g, '')
            const result = await signInPatientWithOTP(cleanMobile)
            
            if (result.success) {
                setError("")
                // Show success message briefly
                setError("OTP resent successfully!")
                setTimeout(() => setError(""), 3000)
            } else {
                setError(result.error || 'Failed to resend OTP')
            }
        } catch (error) {
            console.error('Resend OTP error:', error)
            setError("Failed to resend OTP. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50">
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
                                        Enter your registered mobile number
                                    </p>
                                </div>

                                {error && (
                                    <div className={`p-3 border rounded-lg ${
                                        error.includes('successfully') 
                                            ? 'bg-green-50 border-green-200 text-green-700'
                                            : 'bg-red-50 border-red-200 text-red-700'
                                    }`}>
                                        <p className="text-sm">{error}</p>
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
                                        OTP sent to {mobileNumber} via SMS
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        SMS may take 1-2 minutes to arrive
                                    </p>
                                </div>

                                {error && (
                                    <div className={`p-3 border rounded-lg ${
                                        error.includes('successfully') 
                                            ? 'bg-green-50 border-green-200 text-green-700'
                                            : 'bg-red-50 border-red-200 text-red-700'
                                    }`}>
                                        <p className="text-sm">{error}</p>
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

                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleBackToMobile}
                                            className="flex-1 h-12 text-base"
                                            disabled={isLoading}
                                        >
                                            Change Number
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleResendOTP}
                                            className="flex-1 h-12 text-base"
                                            disabled={isLoading}
                                        >
                                            Resend OTP
                                        </Button>
                                    </div>
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
                    </div>
                </div>
            </div>
        </div>
    )
}