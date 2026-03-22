// Production Authentication Types
export interface AuthSession {
    userId: string
    email?: string
    role: 'doctor' | 'patient'
    approved?: boolean
    profile?: DoctorProfile | PatientProfile
}

export interface DoctorProfile {
    id: string
    email: string
    full_name: string
    approval_status: 'pending' | 'approved' | 'rejected'
    created_at: string
    updated_at: string
}

export interface PatientProfile {
    id: string
    auth_user_id: string
    email?: string
    full_name?: string
    patient_data: PatientData
    created_at: string
    updated_at: string
}

export interface PatientData {
    diagnosis?: {
        primaryCategory: string
        subtype?: string
        ctdType?: string
        sarcoidosisStage?: string
        dateOfDiagnosis?: string
    }
    demographics?: {
        age?: number
        gender?: string
        occupation?: string
    }
    medicalHistory?: {
        smokingHistory?: {
            status: string
            packYears?: string
        }
        allergies?: string[]
        comorbidities?: string[]
    }
    currentMedications?: Array<{
        drugName: string
        dose: string
        frequency: string
        isActive: boolean
        startDate?: string
    }>
    latestPFT?: {
        testDate: string
        fvc?: string
        fev1?: string
        dlco?: string
        sixMWD?: string
        minSpO2?: string
        maxSpO2?: string
    }
    respiratorySupport?: {
        ltot?: { enabled: boolean; oxygenLitres: string }
        bipap?: { enabled: boolean; overnightUse: boolean; allTimeUse: boolean }
        invasiveVentilation?: { enabled: boolean }
        tracheostomy?: { enabled: boolean }
    }
}

// Disease-specific routing map
export const DISEASE_DASHBOARD_ROUTES = {
    "Interstitial Lung Disease (ILD)": "/patient/dashboard/ild",
    "Bronchial Asthma": "/patient/dashboard/asthma",
    "COPD (Chronic Obstructive Pulmonary Disease)": "/patient/dashboard/oad",
    "Obstructive Airway Disease (OAD)": "/patient/dashboard/oad",
    "Bronchiectasis": "/patient/dashboard/bronchiectasis",
    "Post ICU Recovery": "/patient/dashboard/post-icu"
} as const

export type DiagnosisCategory = keyof typeof DISEASE_DASHBOARD_ROUTES

// Helper function to get dashboard route from diagnosis
export function getDashboardRoute(diagnosis?: string): string {
    if (!diagnosis) return "/patient/dashboard/ild" // Default
    
    const route = DISEASE_DASHBOARD_ROUTES[diagnosis as DiagnosisCategory]
    return route || "/patient/dashboard/ild" // Default fallback
}

// OTP verification response
export interface OTPVerificationResponse {
    success: boolean
    error?: string
    session?: AuthSession
    profile?: DoctorProfile | PatientProfile
}

// Login response for patient login
export interface LoginResponse {
    success: boolean
    error?: string
    session?: AuthSession
}

// Auth state for components
export interface AuthContextType {
    user: any | null
    loading: boolean
    role: 'doctor' | 'patient' | null
    approved?: boolean
    profile?: DoctorProfile | PatientProfile | null
    signOut: () => Promise<void>
}