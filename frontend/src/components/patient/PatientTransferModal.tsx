"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
    initiatePatientTransfer, 
    getTransferStatus, 
    cancelPendingTransfer,
    formatTimeRemaining 
} from "@/lib/patient-transfer"
import { UserX, Clock, Shield, AlertTriangle, Copy, CheckCircle } from "lucide-react"

interface PatientTransferModalProps {
    patientId: string
    isOpen: boolean
    onClose: () => void
}

export default function PatientTransferModal({ 
    patientId, 
    isOpen, 
    onClose 
}: PatientTransferModalProps) {
    const [step, setStep] = useState<'confirm' | 'generating' | 'otp-display' | 'success'>('confirm')
    const [otp, setOtp] = useState<string>('')
    const [expiresAt, setExpiresAt] = useState<string>('')
    const [timeRemaining, setTimeRemaining] = useState<number>(0)
    const [error, setError] = useState<string>('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (isOpen) {
            checkExistingTransfer()
        }
    }, [isOpen, patientId])

    useEffect(() => {
        let interval: NodeJS.Timeout
        
        if (step === 'otp-display' && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    const newTime = prev - 1000
                    if (newTime <= 0) {
                        setStep('confirm')
                        setError('OTP expired. Please generate a new one.')
                    }
                    return Math.max(0, newTime)
                })
            }, 1000)
        }
        
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [step, timeRemaining])

    const checkExistingTransfer = () => {
        const status = getTransferStatus(patientId)
        if (status.hasPending) {
            setStep('otp-display')
            setExpiresAt(status.expiresAt || '')
            setTimeRemaining(status.timeRemaining || 0)
            // Note: We don't show the actual OTP for security
        }
    }

    const handleInitiateTransfer = async () => {
        setStep('generating')
        setError('')
        
        try {
            const result = await initiatePatientTransfer(patientId)
            
            if (result.success && result.otp) {
                setOtp(result.otp)
                setExpiresAt(result.expiresAt || '')
                setTimeRemaining(10 * 60 * 1000) // 10 minutes in milliseconds
                setStep('otp-display')
            } else {
                setError(result.error || 'Failed to generate transfer code')
                setStep('confirm')
            }
        } catch (error) {
            setError('An unexpected error occurred')
            setStep('confirm')
        }
    }

    const handleCopyOTP = async () => {
        try {
            await navigator.clipboard.writeText(otp)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy OTP:', error)
        }
    }

    const handleCancelTransfer = () => {
        const success = cancelPendingTransfer(patientId)
        if (success) {
            setStep('confirm')
            setOtp('')
            setExpiresAt('')
            setTimeRemaining(0)
            setError('')
        } else {
            setError('Failed to cancel transfer')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 space-y-6">
                {step === 'confirm' && (
                    <>
                        <div className="text-center">
                            <UserX className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Change Doctor</h3>
                            <p className="text-gray-600 text-sm">
                                This will generate a secure transfer code that your new doctor can use to import your medical records.
                            </p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-yellow-800 mb-1">Important:</p>
                                    <ul className="text-yellow-700 space-y-1">
                                        <li>• Your current doctor will lose access immediately</li>
                                        <li>• Transfer code expires in 10 minutes</li>
                                        <li>• Your medical history will be preserved</li>
                                        <li>• This action cannot be undone</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleInitiateTransfer} className="flex-1 bg-orange-600 hover:bg-orange-700">
                                Generate Transfer Code
                            </Button>
                        </div>
                    </>
                )}

                {step === 'generating' && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold mb-2">Generating Transfer Code</h3>
                        <p className="text-gray-600 text-sm">Please wait...</p>
                    </div>
                )}

                {step === 'otp-display' && (
                    <>
                        <div className="text-center">
                            <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Transfer Code Generated</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Share this code with your new doctor to complete the transfer
                            </p>
                        </div>

                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <div className="text-3xl font-mono font-bold text-gray-900 mb-2 tracking-wider">
                                {otp}
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleCopyOTP}
                                className="mt-2"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Code
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-red-600" />
                                <span className="font-medium text-red-800">Time Remaining</span>
                            </div>
                            <div className="text-2xl font-mono font-bold text-red-700">
                                {formatTimeRemaining(timeRemaining)}
                            </div>
                            <p className="text-sm text-red-600 mt-1">
                                Code expires at {new Date(expiresAt).toLocaleTimeString()}
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 mb-2">Instructions for New Doctor:</h4>
                            <ol className="text-sm text-blue-700 space-y-1">
                                <li>1. Go to Doctor Dashboard → "Import Patient"</li>
                                <li>2. Enter Patient ID: <code className="bg-blue-100 px-1 rounded">{patientId}</code></li>
                                <li>3. Enter Transfer Code: <code className="bg-blue-100 px-1 rounded">{otp}</code></li>
                                <li>4. Complete the import process</li>
                            </ol>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleCancelTransfer} className="flex-1">
                                Cancel Transfer
                            </Button>
                            <Button onClick={onClose} className="flex-1">
                                Done
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </div>
    )
}