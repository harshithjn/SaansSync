"use client"

import { useState } from 'react'
import { X, Mail, User, Phone, CheckCircle, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signUpDoctor } from '@/lib/auth-service'
import { toast } from '@/lib/toast'

interface DoctorRegistrationModalProps {
    isOpen: boolean
    onClose: () => void
}

export function DoctorRegistrationModal({ isOpen, onClose }: DoctorRegistrationModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        email: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.phoneNumber || !formData.email) {
            toast.error('Please fill in all fields')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            toast.error('Please enter a valid email address')
            return
        }

        const phoneRegex = /^[0-9]{10}$/
        if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ''))) {
            toast.error('Please enter a valid 10-digit phone number')
            return
        }

        setIsSubmitting(true)

        try {
            const result = await signUpDoctor(
                formData.email.trim(),
                formData.name.trim(),
                formData.phoneNumber.replace(/\D/g, '')
            )

            if (result.success) {
                setShowSuccess(true)
                // Reset form
                setFormData({
                    name: '',
                    phoneNumber: '',
                    email: ''
                })
                toast.success(result.message || 'Registration successful!')
            } else {
                toast.error(result.error || 'Registration failed. Please try again.')
            }
        } catch (error) {
            console.error('Registration error:', error)
            toast.error('An unexpected error occurred. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setShowSuccess(false)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100">
                {!showSuccess ? (
                    <>
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Stethoscope className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Create Doctor Account</h2>
                                    <p className="text-sm text-gray-500">Join our medical platform</p>
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
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                    <Phone className="w-4 h-4 text-blue-600" />
                                    Phone Number *
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

                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Creating Account...
                                    </div>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <CheckCircle className="w-3 h-3 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-blue-800 font-medium">Registration Process</p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        After registration, your details will be sent directly to our admin team for review. No email verification required! Once approved, you can login using your email and OTP.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Registration Submitted!</h2>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            Your doctor account has been created successfully.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                            <p className="text-sm text-blue-800 font-medium mb-2">What happens next:</p>
                            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                                <li>Your details are sent to admin for review</li>
                                <li>Admin will approve or reject your application</li>
                                <li>Once approved, you can login using email + OTP</li>
                                <li>No email verification required!</li>
                            </ol>
                        </div>
                        <Button
                            onClick={handleClose}
                            className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            Got it, Thanks!
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}