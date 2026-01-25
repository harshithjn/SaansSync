// Authentication Types
export interface PatientCredentials {
    patientId: string
    email: string
    passwordHash: string
    role: "PATIENT"
    forcePasswordChange: boolean
    createdAt: string
    updatedAt: string
}

export interface AuthSession {
    patientId: string
    email: string
    role: "PATIENT"
    primaryDiagnosisCategory: string
    token: string
}

export interface LoginRequest {
    email: string
    password: string
}

export interface LoginResponse {
    success: boolean
    session?: AuthSession
    error?: string
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

// Patient Dashboard Data
export interface PatientDashboardData {
    patientId: string
    fullName: string
    diagnosis: {
        primaryCategory: string
        subtype: string
        ctdType?: string
        sarcoidosisStage?: string
        dateOfDiagnosis: string
    }
    latestMedications: Array<{
        drugName: string
        dose: string
        frequency: string
        isActive: boolean
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
    smokingHistory?: {
        status: string
        packYears?: string
    }
}