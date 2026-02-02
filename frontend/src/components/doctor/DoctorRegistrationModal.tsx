"use client"

import { useState } from 'react'
import { X, Mail, User, Phone, CheckCircle, Stethoscope, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { startDoctorRegistration, completeDoctorRegistration } from '@/lib/auth-service'
import { toast } from '@/lib/toast'

interface DoctorRegistrationModalProps {
    isOpen: boolean
    onClose: () => void
}

export function DoctorRegistrationModal({ isOpen, onClose }: DoctorRegistrationModalProps) {
    const [step, setStep] = useState<'details' | 'otp' | 'success'>('details')
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        altPhoneNumber: '',
        email: '',
        otp: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.phoneNumber || !formData.email) {
            toast.error('Please fill in all mandatory fields')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            toast.error('Please enter a valid email address')
            return
        }

        const phoneRegex = /^[0-9]{10}$/
        if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ''))) {
            toast.error('Please enter a valid 10-digit mobile number')
            return
        }

        if (formData.altPhoneNumber) {
            if (!phoneRegex.test(formData.altPhoneNumber.replace(/\D/g, ''))) {
                toast.error('Please enter a valid 10-digit alternate mobile number')
                return
            }
        }

        setIsSubmitting(true)

        try {
            const result = await startDoctorRegistration(
                formData.phoneNumber.replace(/\D/g, '')
            )

            if (result.success) {
                setStep('otp')
                toast.success('OTP sent to your mobile number')
            } else {
                toast.error(result.error || 'Failed to send OTP')
            }
        } catch (error) {
            console.error('OTP error:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP')
            return
        }

        setIsSubmitting(true)

        try {
            const result = await completeDoctorRegistration(
                formData.phoneNumber.replace(/\D/g, ''),
                formData.otp,
                formData.email,
                formData.name,
                formData.altPhoneNumber
            )

            if (result.success) {
                setStep('success')
                toast.success('Registration successful!')
            } else {
                toast.error(result.error || 'Registration failed')
            }
        } catch (error) {
            console.error('Registration error:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setStep('details')
        setFormData({
            name: '',
            phoneNumber: '',
            altPhoneNumber: '',
            email: '',
            otp: ''
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100">
                {step === 'success' ? (
                    <div className="text-center py-4">
                        <div className="w-20 h-20 rounded-full bg-linear-to-r from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Registration Submitted!</h2>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            Your account is now <span className="font-semibold text-amber-600">Pending Approval</span>.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                            <p className="text-sm text-blue-800 font-medium mb-2">Next Steps:</p>
                            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                                <li>Admin reviews your application.</li>
                                <li>Once approved, you will be notified.</li>
                                <li>You will then <strong>set your password</strong> for future logins.</li>
                            </ol>
                        </div>
                        <Button
                            onClick={handleClose}
                            className="w-full h-12 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            Got it, Thanks!
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Stethoscope className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Doctor Registration</h2>
                                    <p className="text-sm text-gray-500">
                                        {step === 'details' ? 'Enter your details' : 'Verify Mobile Number'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Form */}
                        {step === 'details' ? (
                            <form onSubmit={handleSendOTP} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <User className="w-4 h-4 text-blue-600" />
                                        Full Name *
                                    </label>
                                    <Input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Dr. John Smith"
                                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-blue-600" />
                                        Email Address *
                                    </label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder="doctor@hospital.com"
                                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-blue-600" />
                                            Mobile *
                                        </label>
                                        <Input
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                            placeholder="9876543210"
                                            className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            Alt Mobile (Opt)
                                        </label>
                                        <Input
                                            type="tel"
                                            value={formData.altPhoneNumber}
                                            onChange={(e) => handleInputChange('altPhoneNumber', e.target.value)}
                                            placeholder="Optional"
                                            className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-blue-600" />
                                        Enter OTP sent to {formData.phoneNumber}
                                    </label>
                                    <Input
                                        type="text"
                                        value={formData.otp}
                                        onChange={(e) => handleInputChange('otp', e.target.value)}
                                        placeholder="123456"
                                        maxLength={6}
                                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-center text-lg tracking-widest"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep('details')}
                                        className="flex-1 h-12 rounded-xl"
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 h-12 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Verifying...' : 'Verify & Register'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
