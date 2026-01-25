import { PatientCredentials, AuthSession, LoginRequest, LoginResponse, DISEASE_DASHBOARD_ROUTES } from './auth-types'
import { PatientData } from './patient-types'

// Simple hash function for demo (use bcrypt in production)
export const hashPassword = (password: string): string => {
    // This is a simple demo hash - use bcrypt in production
    return btoa(password + "salt123")
}

export const verifyPassword = (password: string, hash: string): boolean => {
    return hashPassword(password) === hash
}

// Generate unique patient ID
export const generatePatientId = (): string => {
    return 'PAT-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
}

// Create patient credentials when doctor creates a patient
export const createPatientCredentials = (email: string): PatientCredentials => {
    const patientId = generatePatientId()
    const defaultPassword = "patient123"

    return {
        patientId,
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(defaultPassword),
        role: "PATIENT",
        forcePasswordChange: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
}

// Validate patient login
export const validatePatientLogin = async (
    loginRequest: LoginRequest,
    patientCredentials: PatientCredentials[],
    patientData: PatientData[]
): Promise<LoginResponse> => {
    const email = loginRequest.email.toLowerCase().trim()

    // Find patient credentials
    const credentials = patientCredentials.find(cred => cred.email === email)
    if (!credentials) {
        return { success: false, error: "Invalid email or password" }
    }

    // Verify password
    if (!verifyPassword(loginRequest.password, credentials.passwordHash)) {
        return { success: false, error: "Invalid email or password" }
    }

    // Find patient data
    const patient = patientData.find(p => p.emailId === email)
    if (!patient) {
        return { success: false, error: "Patient data not found" }
    }

    // Create session
    const session: AuthSession = {
        patientId: credentials.patientId,
        email: credentials.email,
        role: "PATIENT",
        primaryDiagnosisCategory: patient.diagnosis.primaryCategory,
        token: generateSessionToken(credentials.patientId)
    }

    return { success: true, session }
}

// Generate session token (use JWT in production)
export const generateSessionToken = (patientId: string): string => {
    const payload = {
        patientId,
        timestamp: Date.now(),
        role: "PATIENT"
    }
    return btoa(JSON.stringify(payload))
}

// Verify session token
export const verifySessionToken = (token: string): { patientId: string; role: string } | null => {
    try {
        const payload = JSON.parse(atob(token))
        if (payload.role === "PATIENT" && payload.patientId) {
            return { patientId: payload.patientId, role: payload.role }
        }
        return null
    } catch {
        return null
    }
}

// Get dashboard route for diagnosis
export const getDashboardRoute = (primaryDiagnosisCategory: string): string => {
    return DISEASE_DASHBOARD_ROUTES[primaryDiagnosisCategory as keyof typeof DISEASE_DASHBOARD_ROUTES] || "/patient/dashboard"
}

// Check if patient can access resource
export const canPatientAccess = (sessionPatientId: string, resourcePatientId: string): boolean => {
    return sessionPatientId === resourcePatientId
}

// Session storage utilities (client-side)
export const storeSession = (session: AuthSession): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('patientSession', JSON.stringify(session))
    }
}

export const getStoredSession = (): AuthSession | null => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('patientSession')
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

export const clearSession = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('patientSession')
    }
}