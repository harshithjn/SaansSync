// Doctor Session Management
import { getApprovedDoctors, type ApprovedDoctor } from './doctor-storage'

export interface DoctorSession {
    doctorId: string
    name: string
    email: string
    phoneNumber: string
    loginTime: string
    token: string
}

// Generate unique doctor ID for session
export const generateDoctorId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9).toUpperCase()
}

// Create doctor session after successful login
export const createDoctorSession = (email: string): DoctorSession | null => {
    const approvedDoctors = getApprovedDoctors()
    const doctor = approvedDoctors.find(doc => doc.email.toLowerCase() === email.toLowerCase() && doc.isActive)

    if (!doctor) return null

    const session: DoctorSession = {
        doctorId: generateDoctorId(),
        name: doctor.name,
        email: doctor.email,
        phoneNumber: doctor.phoneNumber,
        loginTime: new Date().toISOString(),
        token: btoa(JSON.stringify({ email: doctor.email, timestamp: Date.now() }))
    }

    return session
}

// Store doctor session
export const storeDoctorSession = (session: DoctorSession): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('doctorSession', JSON.stringify(session))
    }
}

// Get stored doctor session
export const getStoredDoctorSession = (): DoctorSession | null => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('doctorSession')
        if (stored) {
            try {
                return JSON.parse(stored)
            } catch {
                return null
            }
        }
    }
    return null
}

// Clear doctor session (logout)
export const clearDoctorSession = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('doctorSession')
    }
}

// Verify doctor session is valid
export const verifyDoctorSession = (doctorId: string): boolean => {
    const session = getStoredDoctorSession()
    return session !== null && session.doctorId === doctorId
}

// Get doctor info by session
export const getDoctorBySession = (): DoctorSession | null => {
    return getStoredDoctorSession()
}