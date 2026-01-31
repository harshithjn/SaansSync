"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Stethoscope, User, Mail, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/common/Header'
import { DoctorRegistrationModal } from '@/components/doctor/DoctorRegistrationModal'
import { signInDoctorWithOTP, verifyDoctorOTP } from '@/lib/auth-service'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signInDoctorWithOTP(email.trim())
      
      if (result.success) {
        setStep('otp')
      } else {
        setError(result.error || 'Failed to send OTP')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) {
      setError("Please enter the OTP")
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await verifyDoctorOTP(email.trim(), otp.trim())
      
      if (result.success && result.doctorProfile) {
        // Redirect to dashboard
        router.push(`/doctor/dashboard/${result.doctorProfile.id}`)
      } else {
        setError(result.error || 'OTP verification failed')
        
        // If account is pending/rejected, show appropriate message
        if (result.error?.includes('pending')) {
          router.push('/doctor/pending-approval')
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtp('')
    setError('')
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await signInDoctorWithOTP(email.trim())
      
      if (result.success) {
        setError('')
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
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
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
                {step === 'email' 
                  ? 'Secure access for healthcare professionals'
                  : 'Enter the OTP sent to your email'
                }
              </p>
            </div>

            {step === 'email' ? (
              <form onSubmit={handleEmailSubmit} className="space-y-5">
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
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={loading}
                    />
                  </div>
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
                  className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOTPSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-base font-medium text-gray-700">
                    Enter OTP
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center text-lg tracking-widest"
                      required
                      disabled={loading}
                      maxLength={6}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    OTP sent to {email}
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
                    className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToEmail}
                      className="flex-1 h-12 text-base"
                      disabled={loading}
                    >
                      Change Email
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResendOTP}
                      className="flex-1 h-12 text-base"
                      disabled={loading}
                    >
                      Resend OTP
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Other login options */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center mb-4">
                <button
                  onClick={() => setShowRegistrationModal(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                  disabled={loading}
                >
                  Create your account
                </button>
              </div>

              <p className="text-center text-sm text-gray-600 mb-4">Other login options:</p>
              <div className="flex gap-3">
                <Link href="/patient/login" className="flex-1">
                  <Button variant="outline" className="w-full text-sm">
                    Patient Login
                  </Button>
                </Link>
                <Link href="/admin/login" className="flex-1">
                  <Button variant="outline" className="w-full text-sm">
                    Admin Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Registration Modal */}
      <DoctorRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
      />
    </div>
  )
}