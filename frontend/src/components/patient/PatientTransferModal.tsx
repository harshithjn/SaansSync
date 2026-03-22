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
import { UserX, Clock, ShieldCheck, AlertTriangle, Copy, CheckCircle2, Loader2, ArrowRight, Zap, ShieldAlert } from "lucide-react"

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
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-500 font-['Matter_Regular',sans-serif]">
            <Card className="w-full max-w-xl bg-white p-12 space-y-12 rounded-[4rem] shadow-2xl border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 -z-10 -translate-y-32 translate-x-32" />
                
                {step === 'confirm' && (
                    <>
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 bg-rose-50 rounded-[2.5rem] flex items-center justify-center border border-rose-100 shadow-sm shadow-rose-50/50">
                                <UserX className="w-10 h-10 text-rose-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-slate-950 tracking-tighter leading-none">Clinical Authority Transfer</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocol Initiation</p>
                            </div>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm">
                                This procedure initializes a secure clinical uplink to transfer your medical authority to a new practitioner.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 opacity-[0.03] rounded-full -translate-y-16 translate-x-16 transition-all duration-700 group-hover:scale-125" />
                            <div className="flex items-start gap-5 relative z-10">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Critical Constraints:</p>
                                    <ul className="text-[11px] text-slate-500 font-bold space-y-3">
                                        <li className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                            Immediate revocation of current physician access
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                            Clinical telemetry log persistence (Archival preserved)
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                            Transmission window: 600s TTL (Time-To-Live)
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center gap-3 animate-in slide-in-from-top-2">
                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-4 pt-4">
                            <Button variant="ghost" onClick={onClose} className="flex-1 h-16 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 hover:text-slate-950 hover:bg-slate-50 transition-all border border-slate-100/50">
                                Terminate Protocol
                            </Button>
                            <Button onClick={handleInitiateTransfer} className="flex-1 h-16 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 transition-all active:scale-95 group">
                                Initialize Transfer
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </>
                )}

                {step === 'generating' && (
                    <div className="flex flex-col items-center justify-center py-20 gap-8 animate-in zoom-in-95">
                        <div className="relative">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center">
                                <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
                            </div>
                            <div className="absolute inset-0 w-24 h-24 border-2 border-slate-900 rounded-[2.5rem] animate-pulse opacity-10" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black text-slate-950 tracking-tighter">Securing Uplink</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Generating RSA-4096 Transfer Signature</p>
                        </div>
                    </div>
                )}

                {step === 'otp-display' && (
                    <>
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center border border-emerald-100 shadow-sm">
                                <ShieldCheck className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-slate-950 tracking-tighter">Uplink Code Engaged</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Clinical Authorization Key</p>
                            </div>
                        </div>

                        <div className="bg-slate-950 p-10 rounded-[3rem] text-center shadow-2xl shadow-slate-200 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 blur-xl" />
                           <div className="text-5xl font-black text-white mb-6 tracking-[0.25em] font-mono leading-none">
                                {otp || '••••••'}
                            </div>
                            <Button 
                                variant="ghost" 
                                onClick={handleCopyOTP}
                                className="h-10 px-6 rounded-xl bg-white/10 hover:bg-white text-white hover:text-slate-950 font-black text-[9px] uppercase tracking-widest transition-all gap-2 border-none"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Signature Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy Identifier
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100/50 flex flex-col justify-center gap-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                                    <span className="text-[9px] font-black text-rose-900 uppercase tracking-widest">Window Remaining</span>
                                </div>
                                <div className="text-2xl font-black text-rose-950 tracking-tighter leading-none">
                                    {formatTimeRemaining(timeRemaining)}
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-center gap-2">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target ID</span>
                                </div>
                                <div className="text-sm font-black text-slate-900 tracking-tight leading-none overflow-hidden text-ellipsis">
                                    {patientId}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 pt-4">
                            <Button variant="ghost" onClick={handleCancelTransfer} className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-none transition-all">
                                Abort Transfer
                            </Button>
                            <Button onClick={onClose} className="flex-1 h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest transition-all">
                                Protocol Complete
                            </Button>
                        </div>
                        
                        <div className="text-center pt-2">
                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                <ShieldCheck className="w-3 h-3" /> Secure End-to-End Handshake Active
                            </p>
                        </div>
                    </>
                )}
            </Card>
        </div>
    )
}