"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Mail, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-guard'
import { signOut, getCurrentUserProfile } from '@/lib/auth-service'
import { toast } from '@/lib/toast'

export default function DoctorPendingApprovalPage() {
  const router = useRouter()
  const authState = useAuth()
  const [checking, setChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const handleCheckApproval = async () => {
    if (!authState.user) return

    setChecking(true)
    try {
      // Get current user profile to check approval status
      const { role, profile, approved } = await getCurrentUserProfile()

      if (role === 'doctor' && approved) {
        // Redirect to dashboard
        router.push(`/doctor/dashboard/${profile.id}`)
        return
      } else if (role === 'doctor' && profile?.approval_status === 'rejected') {
        // Show rejection message
        alert('Your account has been rejected. Please contact support for more information.')
      }

      setLastChecked(new Date())
    } catch (error) {
      console.error('Check approval error:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Auto-check approval status every 30 seconds
  useEffect(() => {
    if (!authState.user) return

    const interval = setInterval(() => {
      handleCheckApproval()
    }, 30000)

    return () => clearInterval(interval)
  }, [authState.user])

  // Redirect if already approved
  useEffect(() => {
    if (!authState.loading && authState.approved && authState.role === 'doctor') {
      router.push(`/doctor/dashboard/${authState.profile?.id}`)
    }
  }, [authState, router])

  // Check for email verification status from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    
    if (error === 'verification_failed') {
      toast.error('Email verification failed. Please try registering again.')
    }
  }, [])

  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-xl bg-yellow-100 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h1>
              <p className="text-gray-600">
                Your doctor account is currently under review by our admin team.
              </p>
            </div>

            <div className="space-y-6">
              {/* Status Card */}
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">Approval Status</h3>
                    <p className="text-sm text-yellow-800">
                      Your account is pending approval. This process typically takes 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">What happens next?</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Admin team reviews your credentials</li>
                      <li>• You'll receive an email notification</li>
                      <li>• Once approved, you can access your dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Check Status Button */}
              <Button
                onClick={handleCheckApproval}
                disabled={checking}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {checking ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Checking Status...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Check Approval Status
                  </div>
                )}
              </Button>

              {lastChecked && (
                <p className="text-xs text-gray-500 text-center">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}

              {/* Sign Out */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full h-12"
                >
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Contact Support */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Need Help?</h4>
              <p className="text-xs text-gray-600">
                If you have questions about your approval status, please contact our support team at{' '}
                <a href="mailto:support@healthplatform.com" className="text-blue-600 hover:underline">
                  support@healthplatform.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}