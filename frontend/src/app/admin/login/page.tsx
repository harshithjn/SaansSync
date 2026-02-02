"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'

export default function AdminLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Simple admin authentication - hardcoded for demo
            const adminCredentials = {
                'harshithj1121@gmail.com': 'admin123',
                'admin@healthplatform.com': 'admin123',
                'admin@saanssync.com': 'admin123'
            }

            // Check credentials
            if (!adminCredentials[email as keyof typeof adminCredentials]) {
                setError('Invalid admin email')
                return
            }

            if (adminCredentials[email as keyof typeof adminCredentials] !== password) {
                setError('Invalid admin password')
                return
            }

            // Create a simple admin session (for demo purposes)
            // In production, you'd want proper JWT tokens
            const adminSession = {
                email,
                role: 'admin',
                full_name: 'System Administrator',
                timestamp: Date.now()
            }

            // Create admin Supabase session for database operations
            try {
                console.log('🔐 Creating admin Supabase session...')
                
                // Try to sign in with admin credentials
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password: 'admin123'
                })

                if (signInData?.session && signInData?.user) {
                    console.log('✅ Admin Supabase session created')
                    toast.success('Admin login successful!')
                    router.push('/admin/dashboard')
                    return
                }

                if (signInError) {
                    console.log('❌ Admin sign in failed:', signInError.message)
                    
                    // If sign in fails, try to create admin account
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email,
                        password: 'admin123',
                        options: {
                            data: {
                                role: 'admin',
                                full_name: 'System Administrator'
                            }
                        }
                    })

                    if (signUpError) {
                        if (signUpError.message.includes('rate limit')) {
                            setError('Too many attempts. Please wait and try again.')
                            return
                        }
                        console.error('❌ Admin account creation failed:', signUpError.message)
                        setError(`Account creation failed: ${signUpError.message}`)
                        return
                    }

                    if (signUpData.user && !signUpData.session) {
                        setError('Admin account created. Please check email for verification, then try logging in again.')
                        return
                    }

                    if (signUpData.session) {
                        console.log('✅ Admin account created and signed in')
                        toast.success('Admin account created successfully!')
                        router.push('/admin/dashboard')
                        return
                    }
                }

                setError('Failed to create admin session. Please try again.')
                
            } catch (supabaseError) {
                console.error('❌ Admin auth error:', supabaseError)
                setError('Authentication system error. Please try again.')
            }

        } catch (error) {
            console.error('Admin login error:', error)
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 shadow-xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-purple-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
                    <p className="text-gray-600">Access the administrative dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email here"
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-700">{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-purple-600 hover:bg-purple-700"
                    >
                        {loading ? 'Signing in...' : 'Sign In as Admin'}
                    </Button>
                </form>


                <div className="mt-4 text-center">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/')}
                        className="text-sm"
                    >
                        Back to Home
                    </Button>
                </div>
            </Card>
        </div>
    )
}