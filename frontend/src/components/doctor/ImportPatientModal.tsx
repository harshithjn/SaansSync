"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { importPatientWithOTP, validatePatientId } from "@/lib/patient-transfer"
import { PatientData } from "@/lib/patient-types"
import { UserPlus, Shield, AlertTriangle, CheckCircle, User, Mail } from "lucide-react"

interface ImportPatientModalProps {
    doctorId: string
    isOpen: boolean
    onClose: () => void
    onSuccess?: (patientData: PatientData) => void
}

export default function ImportPatientModal({ 
    doctorId, 
    isOpen, 
    onClose,
    onSuccess 
}: ImportPatientModalProps) {
    const [step, setStep] = useState<'input' | 'importing' | 'success' | 'error'>('input')
    const [patientId, setPatientId] = useState('')
    const [otpCode, setOtpCode] = useState('')
    const [error, setError] = useState('')
    const [importedPatient, setImportedPatient] = useState<PatientData | null>(null)
    const [validationErrors, setValidationErrors] = useState<{
        patientId?: string
        otpCode?: string
    }>({})

    const validateForm = () => {
        const errors: typeof validationErrors = {}
        
        if (!patientId.trim()) {
            errors.patientId = 'Patient ID (Email) is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientId.trim())) {
            errors.patientId = 'Invalid Patient ID format (should be an email address)'
        }
        
        if (!otpCode.trim()) {
            errors.otpCode = 'Transfer code is required'
        } else if (otpCode.trim().length !== 6) {
            errors.otpCode = 'Transfer code must be 6 digits'
        } else if (!/^\d{6}$/.test(otpCode.trim())) {
            errors.otpCode = 'Transfer code must contain only numbers'
        }
        
        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleImport = async () => {
        if (!validateForm()) return

        setStep('importing')
        setError('')
        
        try {
            const result = await importPatientWithOTP(
                doctorId,
                patientId.trim(),
                otpCode.trim()
            )
            
            if (result.success && result.patientData) {
                setImportedPatient(result.patientData)
                setStep('success')
                
                // Call success callback if provided
                if (onSuccess) {
                    onSuccess(result.patientData)
                }
            } else {
                setError(result.error || 'Failed to import patient')
                setStep('error')
            }
        } catch (error) {
            setError('An unexpected error occurred')
            setStep('error')
        }
    }

    const handleReset = () => {
        setStep('input')
        setPatientId('')
        setOtpCode('')
        setError('')
        setImportedPatient(null)
        setValidationErrors({})
    }

    const handleClose = () => {
        handleReset()
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 space-y-6">
                {step === 'input' && (
                    <>
                        <div className="text-center">
                            <UserPlus className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Import Patient</h3>
                            <p className="text-gray-600 text-sm">
                                Enter the patient's transfer details to import their medical records
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Patient ID (Email ID)
                                </label>
                                <Input
                                    type="email"
                                    placeholder="Enter patient email address"
                                    value={patientId}
                                    onChange={(e) => {
                                        setPatientId(e.target.value)
                                        if (validationErrors.patientId) {
                                            setValidationErrors(prev => ({ ...prev, patientId: undefined }))
                                        }
                                    }}
                                    className={validationErrors.patientId ? 'border-red-500' : ''}
                                />
                                {validationErrors.patientId && (
                                    <p className="text-sm text-red-600">{validationErrors.patientId}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    6-Digit Transfer Code
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    value={otpCode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                                        setOtpCode(value)
                                        if (validationErrors.otpCode) {
                                            setValidationErrors(prev => ({ ...prev, otpCode: undefined }))
                                        }
                                    }}
                                    className={`font-mono text-center text-lg tracking-wider ${validationErrors.otpCode ? 'border-red-500' : ''}`}
                                    maxLength={6}
                                />
                                {validationErrors.otpCode && (
                                    <p className="text-sm text-red-600">{validationErrors.otpCode}</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-purple-800 mb-1">Secure Transfer</p>
                                    <ul className="text-purple-700 space-y-1">
                                        <li>• Transfer codes expire in 10 minutes</li>
                                        <li>• Patient's previous doctor loses access immediately</li>
                                        <li>• All medical history is preserved</li>
                                        <li>• Patient identity is verified during transfer</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleClose} className="flex-1">
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleImport} 
                                className="flex-1"
                                disabled={!patientId.trim() || !otpCode.trim()}
                            >
                                Import Patient
                            </Button>
                        </div>
                    </>
                )}

                {step === 'importing' && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold mb-2">Importing Patient</h3>
                        <p className="text-gray-600 text-sm">Verifying transfer code and importing medical records...</p>
                    </div>
                )}

                {step === 'success' && importedPatient && (
                    <>
                        <div className="text-center">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Patient Imported Successfully</h3>
                            <p className="text-gray-600 text-sm">
                                The patient has been successfully transferred to your care
                            </p>
                        </div>

                        <Card className="p-4 bg-green-50 border-green-200">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-green-600" />
                                    <div>
                                        <div className="font-medium">{importedPatient.fullName}</div>
                                        <div className="text-sm text-gray-600">
                                            {importedPatient.age} years, {importedPatient.sex}
                                        </div>
                                    </div>
                                </div>
                                
                                
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-green-600" />
                                    <span className="text-sm">{importedPatient.emailId}</span>
                                </div>
                                
                                <div className="pt-2 border-t border-green-200">
                                    <Badge className="bg-green-100 text-green-800">
                                        {importedPatient.diagnosis.primaryCategory}
                                    </Badge>
                                </div>
                            </div>
                        </Card>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-yellow-800 mb-1">Next Steps:</p>
                                    <ul className="text-yellow-700 space-y-1">
                                        <li>• Review patient's complete medical history</li>
                                        <li>• Update treatment plans if needed</li>
                                        <li>• Patient can now log health data under your care</li>
                                        <li>• Previous doctor no longer has access</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleReset} className="flex-1">
                                Import Another
                            </Button>
                            <Button onClick={handleClose} className="flex-1">
                                Done
                            </Button>
                        </div>
                    </>
                )}

                {step === 'error' && (
                    <>
                        <div className="text-center">
                            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Import Failed</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Unable to import the patient with the provided details
                            </p>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-800 mb-2">Common Issues:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Transfer code has expired (valid for 10 minutes only)</li>
                                <li>• Incorrect patient ID or transfer code</li>
                                <li>• Transfer code has already been used</li>
                                <li>• Patient is already assigned to this doctor</li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleReset} className="flex-1">
                                Try Again
                            </Button>
                            <Button onClick={handleClose} className="flex-1">
                                Cancel
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </div>
    )
}