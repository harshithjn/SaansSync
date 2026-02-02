"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Stethoscope, User, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/common/Header'
import { DoctorRegistrationModal } from '@/components/doctor/DoctorRegistrationModal'
import { PasswordSetupModal } from '@/components/doctor/PasswordSetupModal'
import { signInDoctorWithPassword } from '@/lib/auth-service'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Modals
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [showPasswordSetupModal, setShowPasswordSetupModal] = useState(false)
  const [passwordModalMode, setPasswordModalMode] = useState<'setup' | 'reset'>('setup')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please enter email and password")
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signInDoctorWithPassword(email.trim(), password)
      
      if (result.success && result.doctorProfile) {
        // Redirect to dashboard
        router.push(`/doctor/dashboard/${result.doctorProfile.id}`)
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const openPasswordSetup = (mode: 'setup' | 'reset') => {
    setPasswordModalMode(mode)
    setShowPasswordSetupModal(true)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-green-50">
      <Header currentPage="login" />

      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Login</h1>
              <p className="text-gray-600 mt-2">
                Secure access for healthcare professionals
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-base font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-base font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => openPasswordSetup('reset')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    required
                    disabled={loading}
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
                <div className="p-3 border rounded-lg bg-red-50 border-red-200 text-red-700">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
               {/* First time setup link */}
               <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-800 mb-2">First time logging in after approval?</p>
                <button
                  onClick={() => openPasswordSetup('setup')}
                  className="text-blue-700 hover:text-blue-800 font-bold text-sm underline"
                >
                  Set up your password here
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowRegistrationModal(true)}
                  className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors"
                >
                  Don't have an account? <span className="text-blue-600 font-bold">Register Now</span>
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-center text-sm text-gray-500 mb-3">Other login options:</p>
                <div className="flex gap-3">
                  <Link href="/patient/login" className="flex-1">
                    <Button variant="outline" className="w-full text-sm rounded-xl h-10">
                      Patient Login
                    </Button>
                  </Link>
                  <Link href="/admin/login" className="flex-1">
                    <Button variant="outline" className="w-full text-sm rounded-xl h-10">
                      Admin Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DoctorRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
      />

      <PasswordSetupModal
        isOpen={showPasswordSetupModal}
        onClose={() => setShowPasswordSetupModal(false)}
        mode={passwordModalMode}
      />
    </div>
  )
}
