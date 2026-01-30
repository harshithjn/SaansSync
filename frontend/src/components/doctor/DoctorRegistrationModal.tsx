"use client"

import { useState } from 'react'
import { X, Upload, FileText, CheckCircle, User, Phone, Mail, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { storeDoctorRegistration } from '@/lib/doctor-storage'
import { toast } from '@/lib/toast'

interface DoctorRegistrationModalProps {
    isOpen: boolean
    onClose: () => void
}

export function DoctorRegistrationModal({ isOpen, onClose }: DoctorRegistrationModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        email: '',
        certificateFile: null as File | null,
        certificateFileName: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setFormData(prev => ({
                ...prev,
                certificateFile: file,
                certificateFileName: file.name
            }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.phoneNumber || !formData.email || !formData.certificateFile) {
            toast.error('Please fill in all fields and upload your certificate')
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
            // Store the registration
            const registrationId = storeDoctorRegistration({
                name: formData.name,
                phoneNumber: formData.phoneNumber,
                email: formData.email,
                certificateFile: formData.certificateFile,
                certificateFileName: formData.certificateFileName,
                status: 'pending'
            })

            if (registrationId) {
                setShowSuccess(true)
                // Reset form
                setFormData({
                    name: '',
                    phoneNumber: '',
                    email: '',
                    certificateFile: null,
                    certificateFileName: ''
                })
            } else {
                toast.error('Error submitting registration. Please try again.')
            }
        } catch (error) {
            toast.error('Error submitting registration. Please try again.')
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

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    Doctor Certificate *
                                </label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer group">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="certificate-upload"
                                    />
                                    <label htmlFor="certificate-upload" className="cursor-pointer">
                                        {formData.certificateFile ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-green-700 block">{formData.certificateFileName}</span>
                                                    <span className="text-xs text-green-600">File uploaded successfully</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors block">
                                                        Click to upload certificate
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        PDF, JPG, PNG (Max 5MB)
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Submitting...
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
                                        Your registration will be reviewed by our admin team. You'll receive an email confirmation within 24 hours.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Success Message */
                    <div className="text-center py-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Registration Submitted!</h2>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Your details have been sent to the admin team. You will receive approval
                            confirmation via email within 24 hours.
                        </p>
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