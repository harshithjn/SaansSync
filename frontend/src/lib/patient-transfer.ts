import { PatientData } from './patient-types'

import { getDoctorPatientFolders, createPatientFolder, removeDoctorPatientMapping } from './doctor-patient-mapping'
import { getPatientProfile } from './database-service'

interface TransferOTP {
    patientId: string
    otp: string
    generatedAt: string
    expiresAt: string
    isUsed: boolean
}

interface TransferAuditLog {
    patientId: string
    oldDoctorId: string
    newDoctorId: string
    timestamp: string
    otpUsed: string
    transferInitiatedBy: 'patient'
}

const TRANSFER_OTP_STORAGE_KEY = 'patient_transfer_otps'
const TRANSFER_AUDIT_STORAGE_KEY = 'patient_transfer_audit'
const OTP_VALIDITY_MINUTES = 10

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

function getOTPExpiry(): string {
    const expiry = new Date()
    expiry.setMinutes(expiry.getMinutes() + OTP_VALIDITY_MINUTES)
    return expiry.toISOString()
}

function storeOTP(transferOTP: TransferOTP): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(TRANSFER_OTP_STORAGE_KEY)
        const allOTPs = stored ? JSON.parse(stored) : {}

        allOTPs[transferOTP.patientId] = transferOTP

        localStorage.setItem(TRANSFER_OTP_STORAGE_KEY, JSON.stringify(allOTPs))
    } catch (error) {
        console.error('Error storing transfer OTP:', error)
    }
}

function getStoredOTP(patientId: string): TransferOTP | null {
    if (typeof window === 'undefined') return null

    try {
        const stored = localStorage.getItem(TRANSFER_OTP_STORAGE_KEY)
        const allOTPs = stored ? JSON.parse(stored) : {}
        return allOTPs[patientId] || null
    } catch (error) {
        console.error('Error reading transfer OTP:', error)
        return null
    }
}

function isOTPValid(otp: TransferOTP): boolean {
    const now = new Date()
    const expiry = new Date(otp.expiresAt)
    return !otp.isUsed && now <= expiry
}

function markOTPAsUsed(patientId: string): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(TRANSFER_OTP_STORAGE_KEY)
        const allOTPs = stored ? JSON.parse(stored) : {}

        if (allOTPs[patientId]) {
            allOTPs[patientId].isUsed = true
            localStorage.setItem(TRANSFER_OTP_STORAGE_KEY, JSON.stringify(allOTPs))
        }
    } catch (error) {
        console.error('Error marking OTP as used:', error)
    }
}

function storeAuditLog(auditLog: TransferAuditLog): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(TRANSFER_AUDIT_STORAGE_KEY)
        const allLogs = stored ? JSON.parse(stored) : []

        allLogs.push(auditLog)

        if (allLogs.length > 1000) {
            allLogs.splice(0, allLogs.length - 1000)
        }

        localStorage.setItem(TRANSFER_AUDIT_STORAGE_KEY, JSON.stringify(allLogs))
    } catch (error) {
        console.error('Error storing audit log:', error)
    }
}

function findCurrentDoctor(patientId: string): string | null {

    const allDoctors = ['doctor@gmail.com']

    for (const doctorId of allDoctors) {
        const folders = getDoctorPatientFolders(doctorId)
        if (Array.isArray(folders) && folders.some(folder => folder.patientId === patientId)) {
            return doctorId
        }
    }

    return null
}

export async function initiatePatientTransfer(patientId: string): Promise<{
    success: boolean
    otp?: string
    expiresAt?: string
    error?: string
}> {
    try {

        const patientData = await getPatientProfile(patientId)
        if (!patientData) {
            return {
                success: false,
                error: 'Patient not found'
            }
        }

        const currentDoctorId = findCurrentDoctor(patientId)
        if (!currentDoctorId) {
            return {
                success: false,
                error: 'No current doctor found for this patient'
            }
        }

        const otp = generateOTP()
        const expiresAt = getOTPExpiry()

        const transferOTP: TransferOTP = {
            patientId,
            otp,
            generatedAt: new Date().toISOString(),
            expiresAt,
            isUsed: false
        }

        storeOTP(transferOTP)

        return {
            success: true,
            otp,
            expiresAt
        }

    } catch (error) {
        console.error('Error initiating patient transfer:', error)
        return {
            success: false,
            error: 'Failed to initiate transfer'
        }
    }
}

export async function importPatientWithOTP(
    newDoctorId: string,
    patientId: string,
    otpCode: string
): Promise<{
    success: boolean
    patientData?: PatientData
    error?: string
}> {
    try {

        const patientData = await getPatientProfile(patientId)
        if (!patientData) {
            return {
                success: false,
                error: 'Patient not found'
            }
        }

        const storedOTP = getStoredOTP(patientId)
        if (!storedOTP) {
            return {
                success: false,
                error: 'No transfer request found for this patient'
            }
        }

        if (storedOTP.otp !== otpCode) {
            return {
                success: false,
                error: 'Invalid OTP code'
            }
        }

        if (!isOTPValid(storedOTP)) {
            return {
                success: false,
                error: 'OTP has expired or already been used'
            }
        }

        const oldDoctorId = findCurrentDoctor(patientId)
        if (!oldDoctorId) {
            return {
                success: false,
                error: 'No current doctor found for this patient'
            }
        }

        if (oldDoctorId === newDoctorId) {
            return {
                success: false,
                error: 'Patient is already assigned to this doctor'
            }
        }

        const removed = removeDoctorPatientMapping(oldDoctorId, patientId)
        if (!removed) {
            return {
                success: false,
                error: 'Failed to remove patient from current doctor'
            }
        }

        const redFlagScore = Math.floor(Math.random() * 10) + 1
        const alertCount = Math.floor(Math.random() * 3)

        createPatientFolder(patientData, newDoctorId, patientId, redFlagScore, alertCount)

        markOTPAsUsed(patientId)

        const auditLog: TransferAuditLog = {
            patientId,
            oldDoctorId,
            newDoctorId,
            timestamp: new Date().toISOString(),
            otpUsed: otpCode,
            transferInitiatedBy: 'patient'
        }
        storeAuditLog(auditLog)

        return {
            success: true,
            patientData
        }

    } catch (error) {
        console.error('Error importing patient with OTP:', error)
        return {
            success: false,
            error: 'Failed to import patient'
        }
    }
}

export function hasPendingTransfer(patientId: string): boolean {
    const storedOTP = getStoredOTP(patientId)
    return storedOTP ? isOTPValid(storedOTP) : false
}

export function getTransferStatus(patientId: string): {
    hasPending: boolean
    expiresAt?: string
    timeRemaining?: number
} {
    const storedOTP = getStoredOTP(patientId)

    if (!storedOTP || !isOTPValid(storedOTP)) {
        return { hasPending: false }
    }

    const expiresAt = storedOTP.expiresAt
    const timeRemaining = new Date(expiresAt).getTime() - new Date().getTime()

    return {
        hasPending: true,
        expiresAt,
        timeRemaining: Math.max(0, timeRemaining)
    }
}

export function cancelPendingTransfer(patientId: string): boolean {
    try {
        markOTPAsUsed(patientId)
        return true
    } catch (error) {
        console.error('Error canceling transfer:', error)
        return false
    }
}

export function getTransferHistory(patientId: string): TransferAuditLog[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(TRANSFER_AUDIT_STORAGE_KEY)
        const allLogs = stored ? JSON.parse(stored) : []

        return allLogs.filter((log: TransferAuditLog) => log.patientId === patientId)
            .sort((a: TransferAuditLog, b: TransferAuditLog) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
    } catch (error) {
        console.error('Error reading transfer history:', error)
        return []
    }
}

export function cleanupExpiredOTPs(): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(TRANSFER_OTP_STORAGE_KEY)
        const allOTPs = stored ? JSON.parse(stored) : {}

        const now = new Date()
        const validOTPs: { [key: string]: TransferOTP } = {}

        Object.keys(allOTPs).forEach(patientId => {
            const otp = allOTPs[patientId]
            if (isOTPValid(otp) && new Date(otp.expiresAt) > now) {
                validOTPs[patientId] = otp
            }
        })

        localStorage.setItem(TRANSFER_OTP_STORAGE_KEY, JSON.stringify(validOTPs))
    } catch (error) {
        console.error('Error cleaning up expired OTPs:', error)
    }
}

export function formatTimeRemaining(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / (1000 * 60))
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`
    } else {
        return `${seconds}s`
    }
}

export function validatePatientId(patientId: string): boolean {

    const mobileRegex = /^[6-9]\d{9}$/
    return mobileRegex.test(patientId)
}