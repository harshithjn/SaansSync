"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Stethoscope, User, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/common/Header'
import { DoctorRegistrationModal } from '@/components/doctor/DoctorRegistrationModal'
import { validateDoctorLogin, initializeDemoDoctor } from '@/lib/doctor-storage'
import { createDoctorSession, storeDoctorSession } from '@/lib/doctor-session'
import { toast } from '@/lib/toast'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)

  useEffect(() => {
    initializeDemoDoctor()
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      // 1) Try Supabase Auth first (Phase 1)
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (!error && data?.user) {
          const user = data.user
          await supabase.from('doctors').upsert(
            { id: user.id, email: user.email ?? email, full_name: user.user_metadata?.full_name ?? user.email ?? email, updated_at: new Date().toISOString() },
            { onConflict: 'id' }
          )
          const session = {
            doctorId: user.id,
            name: (user.user_metadata?.full_name as string) ?? user.email ?? email,
            email: user.email ?? email,
            phoneNumber: '',
            loginTime: new Date().toISOString(),
            token: data.session?.access_token ?? ''
          }
          storeDoctorSession(session)
          toast.success('Signed in')
          router.push(`/doctor/dashboard/${user.id}`)
          setLoading(false)
          return
        }
      }

      // 2) Fallback: mock doctor (test@doctor.com / doctor123)
      await new Promise(resolve => setTimeout(resolve, 500))
      if (validateDoctorLogin(email, password)) {
        let session = createDoctorSession(email)
        if (!session) {
          session = {
            doctorId: '1',
            name: 'Test Doctor',
            email: email,
            phoneNumber: '',
            loginTime: new Date().toISOString(),
            token: btoa(JSON.stringify({ email, timestamp: Date.now() }))
          }
        }
        if (session.doctorId !== '1') session = { ...session, doctorId: '1' }
        storeDoctorSession(session)
        router.push(`/doctor/dashboard/1`)
      } else {
        toast.error('Invalid doctor credentials')
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
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
              <p className="text-gray-600 mt-2">AIIMS physicians and specialists</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-base font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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

              <Button
                type="submit"
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Login'}
              </Button>
            </form>

            {/* Other login options */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center mb-4">
                <button
                  onClick={() => setShowRegistrationModal(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
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
                <Link href="/admin" className="flex-1">
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