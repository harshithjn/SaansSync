"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Shield, Users, Activity, Heart, Mail, Lock } from "lucide-react"
import { signInPatientWithOTP, verifyPatientOTP, signInPatientWithPassword, findPatientByPhone } from "@/lib/auth-service"
import { getDashboardRoute } from "@/lib/auth-types"
import { Header } from '@/components/common/Header'

export default function PatientLoginPage() {
    const router = useRouter()
    const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('password') // Default to password for demo

    // OTP State
    const [step, setStep] = useState<'mobile' | 'otp'>('mobile')
    const [mobileNumber, setMobileNumber] = useState("")
    const [otp, setOtp] = useState("")

    // Password State
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

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
            const cleanMobile = mobileNumber.replace(/\D/g, '')
            if (cleanMobile.length < 10) {
                setError("Please enter a valid 10-digit mobile number")
                setIsLoading(false)
                return
            }

            const otpPromise = signInPatientWithOTP(cleanMobile)
            const timeoutPromise = new Promise<{ success: boolean; error?: string }>((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out.')), 15000)
            })

            const result = await Promise.race([otpPromise, timeoutPromise]) as { success: boolean; error?: string }

            if (result.success) {
                setStep('otp')
            } else {
                setError(result.error || 'Failed to send OTP')
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "An error occurred.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const cleanMobile = mobileNumber.replace(/\D/g, '')
            const result = await verifyPatientOTP(cleanMobile, otp)

            if (result.success && result.patientProfile) {
                const diagnosis = result.patientProfile.patient_data?.diagnosis?.primaryCategory
                const dashboardRoute = getDashboardRoute(diagnosis)
                router.push(dashboardRoute)
            } else {
                setError(result.error || 'OTP verification failed')
            }
        } catch (error) {
            setError("An error occurred during login.")
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const result = await signInPatientWithPassword(email.trim(), password)

            if (result.success && result.patientProfile) {
                const diagnosis = result.patientProfile.patient_data?.diagnosis?.primaryCategory
                const dashboardRoute = getDashboardRoute(diagnosis)
                console.log('Redirecting to dashboard:', dashboardRoute)
                router.push(dashboardRoute)
            } else {
                setError(result.error || 'Invalid email or password')
            }
        } catch (error) {
            setError("An error occurred during login.")
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
                                {loginMethod === 'otp' ? (
                                    <Phone className="w-10 h-10 text-green-600" />
                                ) : (
                                    <Lock className="w-10 h-10 text-green-600" />
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Portal</h1>
                            <p className="text-gray-600">
                                {loginMethod === 'otp' ? 'Login via Mobile OTP' : 'Login via Email & Password'}
                            </p>
                        </div>

                        {/* Login Method Toggle */}
                        <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                            <button
                                onClick={() => { setLoginMethod('password'); setError('') }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${loginMethod === 'password' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Email Login
                            </button>
                            <button
                                onClick={() => { setLoginMethod('otp'); setError('') }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${loginMethod === 'otp' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Mobile OTP
                            </button>
                        </div>

                        {/* Password Form */}
                        {loginMethod === 'password' && (
                            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-base font-medium text-gray-700">Email Address</label>
                                        <div className="relative mt-1">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="patient@example.com"
                                                className="pl-10 h-12"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-base font-medium text-gray-700">Password</label>
                                        <div className="relative mt-1">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <Input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="pl-10 h-12"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 border rounded-lg bg-red-50 border-red-200 text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </Button>
                            </form>
                        )}

                        {/* OTP Form */}
                        {loginMethod === 'otp' && (
                            step === 'mobile' ? (
                                <form onSubmit={handleMobileSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-base font-medium text-gray-700">Mobile Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <Input
                                                type="tel"
                                                value={mobileNumber}
                                                onChange={(e) => setMobileNumber(formatMobileNumber(e.target.value))}
                                                placeholder="123-456-7890"
                                                className="pl-10 h-12 focus:ring-green-500"
                                                required
                                                maxLength={12}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className={`p-3 border rounded-lg text-sm ${error.includes('successfully')
                                                ? 'bg-green-50 border-green-200 text-green-700'
                                                : 'bg-red-50 border-red-200 text-red-700'
                                            }`}>
                                            {error}
                                        </div>
                                    )}

                                    <Button type="submit" className="w-full h-12 bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                                        {isLoading ? 'Sending OTP...' : 'Send OTP'}
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleOtpSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-base font-medium text-gray-700">Enter OTP</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <Input
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="123456"
                                                className="pl-10 h-12 text-center text-lg tracking-widest focus:ring-green-500"
                                                required
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 border rounded-lg bg-red-50 border-red-200 text-red-700 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <Button type="submit" className="w-full h-12 bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                                            {isLoading ? 'Verifying...' : 'Verify & Login'}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => { setStep('mobile'); setOtp(''); setError(''); }} className="w-full h-12">
                                            Change Number
                                        </Button>
                                    </div>
                                </form>
                            )
                        )}

                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
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