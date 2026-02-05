"use client"

import { useState } from 'react'
import { X, Lock, Phone, CheckCircle, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setupDoctorPassword, initiatePasswordReset } from '@/lib/auth-service'
import { toast } from '@/lib/toast'

interface PasswordSetupModalProps {
    isOpen: boolean
    onClose: () => void
    mode: 'setup' | 'reset'
}

export function PasswordSetupModal({ isOpen, onClose, mode }: PasswordSetupModalProps) {
    const [step, setStep] = useState<'phone' | 'otp' | 'password' | 'success'>('phone')
    const [formData, setFormData] = useState({
        phoneNumber: '',
        otp: '',
        password: '',
        confirmPassword: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault()

        const phoneRegex = /^[0-9]{10}$/
        if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ''))) {
            toast.error('Please enter a valid 10-digit mobile number')
            return
        }

        setIsSubmitting(true)

        try {
            // Initiate OTP (same for setup and reset usually, triggers SMS)
            const result = await initiatePasswordReset(formData.phoneNumber.replace(/\D/g, ''))

            if (!result.error) {
                setStep('otp')
                toast.success('OTP sent to your mobile number')
            } else {
                toast.error((result.error as any)?.message || result.error || 'Failed to send OTP')
            }
        } catch (error) {
            console.error('OTP error:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleVerifyOTPAndSetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setIsSubmitting(true)

        try {
            const result = await setupDoctorPassword(
                formData.phoneNumber.replace(/\D/g, ''),
                formData.otp,
                formData.password
            )

            if (result.success) {
                setStep('success')
                toast.success('Password set successfully!')
            } else {
                toast.error(result.error || 'Failed to set password')
            }
        } catch (error) {
            console.error('Password setup error:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setStep('phone')
        setFormData({
            phoneNumber: '',
            otp: '',
            password: '',
            confirmPassword: ''
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {mode === 'setup' ? 'Set Up Password' : 'Reset Password'}
                    </h2>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {step === 'success' ? (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Success!</h3>
                        <p className="text-gray-600 mb-6">
                            Your password has been {mode === 'setup' ? 'set' : 'reset'} successfully.
                            You can now login with your email and new password.
                        </p>
                        <Button onClick={handleClose} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                            Go to Login
                        </Button>
                    </div>
                ) : (
                    <>
                        {step === 'phone' && (
                            <form onSubmit={handleSendOTP} className="space-y-4">
                                <p className="text-sm text-gray-500">
                                    Enter your registered mobile number to verify your identity.
                                </p>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Mobile Number</label>
                                    <Input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                        placeholder="9876543210"
                                        className="h-12 rounded-xl"
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                                    {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                                </Button>
                            </form>
                        )}

                        {(step === 'otp' || step === 'password') && (
                            <form onSubmit={handleVerifyOTPAndSetPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Enter OTP</label>
                                    <Input
                                        type="text"
                                        value={formData.otp}
                                        onChange={(e) => handleInputChange('otp', e.target.value)}
                                        placeholder="123456"
                                        maxLength={6}
                                        className="h-12 rounded-xl text-center tracking-widest"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">New Password</label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        placeholder="Enter new password"
                                        className="h-12 rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                                    <Input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                        placeholder="Confirm new password"
                                        className="h-12 rounded-xl"
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                                    {isSubmitting ? 'Processing...' : 'Set Password'}
                                </Button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
