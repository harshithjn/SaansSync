// Doctor Registration Storage System
// In production, this would be replaced with proper database operations

export interface DoctorRegistration {
    id: string
    name: string
    phoneNumber: string
    email: string
    certificateFile: File | null
    certificateFileName: string
    status: 'pending' | 'approved' | 'rejected'
    submittedAt: string
    reviewedAt?: string
    reviewedBy?: string
    rejectionReason?: string
}

export interface ApprovedDoctor {
    id: string
    name: string
    email: string
    phoneNumber: string
    passwordHash: string
    approvedAt: string
    isActive: boolean
}

// Storage keys
const DOCTOR_REGISTRATIONS_KEY = 'doctor_registrations'
const APPROVED_DOCTORS_KEY = 'approved_doctors'

// Get all doctor registrations
export const getDoctorRegistrations = (): DoctorRegistration[] => {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(DOCTOR_REGISTRATIONS_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error('Error reading doctor registrations:', error)
        return []
    }
}

// Store a new doctor registration
export const storeDoctorRegistration = (registration: Omit<DoctorRegistration, 'id' | 'submittedAt'>): string => {
    if (typeof window === 'undefined') return ''

    try {
        const existingRegistrations = getDoctorRegistrations()

        const newRegistration: DoctorRegistration = {
            ...registration,
            id: 'DOC-REG-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            submittedAt: new Date().toISOString(),
            status: 'pending'
        }

        existingRegistrations.push(newRegistration)
        localStorage.setItem(DOCTOR_REGISTRATIONS_KEY, JSON.stringify(existingRegistrations))

        console.log('Doctor registration stored:', newRegistration.id)
        return newRegistration.id
    } catch (error) {
        console.error('Error storing doctor registration:', error)
        return ''
    }
}

// Update registration status
export const updateRegistrationStatus = (
    id: string,
    status: 'approved' | 'rejected',
    reviewedBy: string,
    rejectionReason?: string
): boolean => {
    if (typeof window === 'undefined') return false

    try {
        const registrations = getDoctorRegistrations()
        const registrationIndex = registrations.findIndex(reg => reg.id === id)

        if (registrationIndex === -1) return false

        registrations[registrationIndex] = {
            ...registrations[registrationIndex],
            status,
            reviewedAt: new Date().toISOString(),
            reviewedBy,
            rejectionReason
        }

        localStorage.setItem(DOCTOR_REGISTRATIONS_KEY, JSON.stringify(registrations))

        // If approved, create doctor account
        if (status === 'approved') {
            createApprovedDoctor(registrations[registrationIndex])
        }

        return true
    } catch (error) {
        console.error('Error updating registration status:', error)
        return false
    }
}

// Create approved doctor account
const createApprovedDoctor = (registration: DoctorRegistration): void => {
    try {
        const approvedDoctors = getApprovedDoctors()

        // Simple hash function for demo (use bcrypt in production)
        const hashPassword = (password: string): string => {
            return btoa(password + "salt123")
        }

        const newDoctor: ApprovedDoctor = {
            id: registration.id,
            name: registration.name,
            email: registration.email,
            phoneNumber: registration.phoneNumber,
            passwordHash: hashPassword('doctor123'),
            approvedAt: new Date().toISOString(),
            isActive: true
        }

        approvedDoctors.push(newDoctor)
        localStorage.setItem(APPROVED_DOCTORS_KEY, JSON.stringify(approvedDoctors))

        console.log('Approved doctor account created:', newDoctor.email)
    } catch (error) {
        console.error('Error creating approved doctor account:', error)
    }
}

// Get all approved doctors
export const getApprovedDoctors = (): ApprovedDoctor[] => {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(APPROVED_DOCTORS_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error('Error reading approved doctors:', error)
        return []
    }
}

// Validate doctor login
export const validateDoctorLogin = (email: string, password: string): boolean => {
    const approvedDoctors = getApprovedDoctors()
    const doctor = approvedDoctors.find(doc => doc.email.toLowerCase() === email.toLowerCase() && doc.isActive)

    if (!doctor) return false

    // Simple hash verification (use bcrypt in production)
    const hashPassword = (password: string): string => {
        return btoa(password + "salt123")
    }

    return doctor.passwordHash === hashPassword(password)
}

// Get pending registrations count
export const getPendingRegistrationsCount = (): number => {
    const registrations = getDoctorRegistrations()
    return registrations.filter(reg => reg.status === 'pending').length
}

// Initialize with demo approved doctor
export const initializeDemoDoctor = (): void => {
    if (typeof window === 'undefined') return

    const approvedDoctors = getApprovedDoctors()
    const demoExists = approvedDoctors.some(doc => doc.email === 'doctor@gmail.com')

    if (!demoExists) {
        const hashPassword = (password: string): string => {
            return btoa(password + "salt123")
        }

        const demoDoctor: ApprovedDoctor = {
            id: 'DEMO-DOC-001',
            name: 'Dr. Demo Physician',
            email: 'doctor@gmail.com',
            phoneNumber: '9876543210',
            passwordHash: hashPassword('aiims123'),
            approvedAt: new Date().toISOString(),
            isActive: true
        }

        approvedDoctors.push(demoDoctor)
        localStorage.setItem(APPROVED_DOCTORS_KEY, JSON.stringify(approvedDoctors))
    }
}