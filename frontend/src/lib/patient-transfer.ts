// Patient Transfer System - OTP-Based Doctor Change
import { PatientData } from './patient-types'
// import { getPatientDataById, updatePatientData } from './patient-storage' // Removed - using database
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

// Generate 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// Generate OTP expiry time
function getOTPExpiry(): string {
    const expiry = new Date()
    expiry.setMinutes(expiry.getMinutes() + OTP_VALIDITY_MINUTES)
    return expiry.toISOString()
}

// Store OTP
function storeOTP(transferOTP: TransferOTP): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(TRANSFER_OTP_STORAGE_KEY)
        const allOTPs = stored ? JSON.parse(stored) : {}

        // Store by patient ID (overwrite any existing OTP)
        allOTPs[transferOTP.patientId] = transferOTP

        localStorage.setItem(TRANSFER_OTP_STORAGE_KEY, JSON.stringify(allOTPs))
    } catch (error) {
        console.error('Error storing transfer OTP:', error)
    }
}

// Get stored OTP
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

// Check if OTP is valid
function isOTPValid(otp: TransferOTP): boolean {
    const now = new Date()
    const expiry = new Date(otp.expiresAt)
    return !otp.isUsed && now <= expiry
}

// Mark OTP as used
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

// Store audit log
function storeAuditLog(auditLog: TransferAuditLog): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(TRANSFER_AUDIT_STORAGE_KEY)
        const allLogs = stored ? JSON.parse(stored) : []

        allLogs.push(auditLog)

        // Keep only last 1000 audit logs
        if (allLogs.length > 1000) {
            allLogs.splice(0, allLogs.length - 1000)
        }

        localStorage.setItem(TRANSFER_AUDIT_STORAGE_KEY, JSON.stringify(allLogs))
    } catch (error) {
        console.error('Error storing audit log:', error)
    }
}

// Find current doctor for patient
function findCurrentDoctor(patientId: string): string | null {
    // Check all doctors to find who has this patient
    const allDoctors = ['doctor@gmail.com'] // In production, this would be a proper doctor list

    for (const doctorId of allDoctors) {
        const folders = getDoctorPatientFolders(doctorId)
        if (Array.isArray(folders) && folders.some(folder => folder.patientId === patientId)) {
            return doctorId
        }
    }

    return null
}

// STEP 1: Patient initiates transfer (generates OTP)
export async function initiatePatientTransfer(patientId: string): Promise<{
    success: boolean
    otp?: string
    expiresAt?: string
    error?: string
}> {
    try {
        // Verify patient exists
        const patientData = await getPatientProfile(patientId)
        if (!patientData) {
            return {
                success: false,
                error: 'Patient not found'
            }
        }

        // Find current doctor
        const currentDoctorId = findCurrentDoctor(patientId)
        if (!currentDoctorId) {
            return {
                success: false,
                error: 'No current doctor found for this patient'
            }
        }

        // Generate new OTP
        const otp = generateOTP()
        const expiresAt = getOTPExpiry()

        const transferOTP: TransferOTP = {
            patientId,
            otp,
            generatedAt: new Date().toISOString(),
            expiresAt,
            isUsed: false
        }

        // Store OTP
        storeOTP(transferOTP)

        // Show OTP to patient (in production, this would be via secure notification)
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

// STEP 2: New doctor imports patient using OTP
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
        // Verify patient exists
        const patientData = await getPatientProfile(patientId)
        if (!patientData) {
            return {
                success: false,
                error: 'Patient not found'
            }
        }

        // Get stored OTP
        const storedOTP = getStoredOTP(patientId)
        if (!storedOTP) {
            return {
                success: false,
                error: 'No transfer request found for this patient'
            }
        }

        // Validate OTP
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

        // Find current doctor
        const oldDoctorId = findCurrentDoctor(patientId)
        if (!oldDoctorId) {
            return {
                success: false,
                error: 'No current doctor found for this patient'
            }
        }

        // Prevent self-transfer
        if (oldDoctorId === newDoctorId) {
            return {
                success: false,
                error: 'Patient is already assigned to this doctor'
            }
        }

        // STEP 3: Execute transfer

        // Remove patient from old doctor
        const removed = removeDoctorPatientMapping(oldDoctorId, patientId)
        if (!removed) {
            return {
                success: false,
                error: 'Failed to remove patient from current doctor'
            }
        }

        // Add patient to new doctor
        const redFlagScore = Math.floor(Math.random() * 10) + 1 // In production, use actual score
        const alertCount = Math.floor(Math.random() * 3) // In production, use actual count

        createPatientFolder(patientData, newDoctorId, patientId, redFlagScore, alertCount)

        // Mark OTP as used
        markOTPAsUsed(patientId)

        // Create audit log
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

// Check if patient has pending transfer
export function hasPendingTransfer(patientId: string): boolean {
    const storedOTP = getStoredOTP(patientId)
    return storedOTP ? isOTPValid(storedOTP) : false
}

// Get transfer status
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

// Cancel pending transfer
export function cancelPendingTransfer(patientId: string): boolean {
    try {
        markOTPAsUsed(patientId)
        return true
    } catch (error) {
        console.error('Error canceling transfer:', error)
        return false
    }
}

// Get transfer history for patient (for debugging only - not visible to doctors)
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

// Cleanup expired OTPs (run periodically)
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

// Format time remaining for display
export function formatTimeRemaining(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / (1000 * 60))
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`
    } else {
        return `${seconds}s`
    }
}

// Validate patient ID format (mobile number)
export function validatePatientId(patientId: string): boolean {
    // Check if it's a valid mobile number (10 digits)
    const mobileRegex = /^[6-9]\d{9}$/
    return mobileRegex.test(patientId)
}