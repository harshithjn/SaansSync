"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Lock, Eye, EyeOff, Users, Activity, Heart } from "lucide-react"
import { LoginRequest } from "@/lib/auth-types"
import { storeSession, getDashboardRoute, validatePatientLogin } from "@/lib/auth-utils"
import { getPatientCredentials, getPatientData, initializeDemoPatients } from "@/lib/patient-storage"
import { Header } from '@/components/common/Header'

export default function PatientLoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [loginData, setLoginData] = useState<LoginRequest>({
        email: "",
        password: ""
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // Initialize demo patients on component mount
    useEffect(() => {
        initializeDemoPatients()
    }, [])

    const handleInputChange = (field: keyof LoginRequest, value: string) => {
        setLoginData(prev => ({ ...prev, [field]: value }))
        if (error) setError("") // Clear error when user types
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            // Get stored patient credentials and data
            const patientCredentials = getPatientCredentials()
            const patientData = getPatientData()

            // Use the proper validation function
            const response = await validatePatientLogin(loginData, patientCredentials, patientData)

            if (response.success && response.session) {
                // Store session
                storeSession(response.session)

                // Get disease-specific dashboard route
                const dashboardRoute = getDashboardRoute(response.session.primaryDiagnosisCategory)

                // Redirect to disease-specific dashboard
                router.push(dashboardRoute)
            } else {
                setError(response.error || "Login failed")
            }
        } catch (error) {
            setError("An error occurred during login. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
            <Header currentPage="login" />

            <div className="flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-6">
                                <Users className="w-10 h-10 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Portal</h1>
                            <p className="text-gray-600">Access your health dashboard</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-base font-medium text-gray-700">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={loginData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        placeholder="patient@example.com"
                                        className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-base font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={loginData.password}
                                        onChange={(e) => handleInputChange("password", e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
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
                                {isLoading ? 'Signing In...' : 'Access Patient Portal'}
                            </Button>
                        </form>

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

                        {/* Demo Credentials */}

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