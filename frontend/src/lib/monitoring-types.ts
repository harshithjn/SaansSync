// Core Monitoring Platform Types
export type DiseaseType = 'Asthma' | 'COPD' | 'ILD' | 'Bronchiectasis' | 'Post-Infection'

export type AlertLevel = 'low' | 'moderate' | 'high' | 'critical'
export type FolderColor = 'green' | 'yellow' | 'orange' | 'red'

// Doctor-Patient Mapping
export interface DoctorPatientMapping {
    doctorId: string
    patientId: string
    createdAt: string
    diseaseType: DiseaseType
}

// Red Flag Scoring System
export interface RedFlagScore {
    patientId: string
    score: number // 1-10
    level: AlertLevel
    factors: string[]
    calculatedAt: string
    diseaseSpecificFactors: any
}

// Common Patient Dashboard Data
export interface CommonPatientData {
    patientId: string
    firstLogDate: string
    aqi: {
        value: number
        pm25: number
        pm10: number
        location: string
        fetchedAt: string
    }
    spo2: {
        atRest: number
        onExertion: number
        baselineTarget: number
    }
    conditionStatus: {
        isStatic: boolean
        hasWorsening: boolean
        hasImprovement: boolean
        oxygenChange: number
    }
    mMRCScale: number // 0-4
    medications: PatientMedicationLog[]
    sideEffects: string[]
    customSideEffect?: string
    symptoms: SymptomVAS[]
}

// Medication Logging
export interface PatientMedicationLog {
    medicationId: string
    drugName: string
    dose: string
    frequency: string
    dateTaken: string
    taken: boolean
    sideEffects?: string[]
}

// VAS Symptoms
export interface SymptomVAS {
    id: string
    name: string
    score: number // 1-10
    previousScore?: number
    loggedAt: string
}

// Disease-Specific Dashboard Data
export interface AsthmaData {
    patientId: string
    logDate: string
    // Asthma Control (Last 4 Weeks)
    daytimeSymptoms: boolean // >2/week
    nightWaking: boolean
    relieverUse: boolean // >2/week
    activityLimitation: boolean
    controlLevel: 'well-controlled' | 'partly-controlled' | 'uncontrolled'
    // Daily Tracking
    rescueInhalerPuffs: number
    peakFlow: number // PEFR L/min
    peakFlowPercent?: number // % of personal best
}

export interface COPDData {
    patientId: string
    logDate: string
    // COPD Impact (Weekly)
    coughFrequency: number // 0-4
    phlegmProduction: number // 0-4
    exerciseTolerance: boolean
    sleepDisturbed: boolean
    // Exacerbation Risk (Daily)
    energyLevel: number // VAS 0-10
    chestHeaviness: number // VAS 0-10
    // Ancillary Data
    dailyStepCount?: number
    sputumVolume: 'none' | 'small' | 'moderate' | 'large'
    sputumColor: string
    fever: boolean
}

export interface BronchiectasisData {
    patientId: string
    logDate: string
    // Sputum Tracker
    sputumVolume: 'none' | 'small' | 'moderate' | 'large'
    sputumColor: 'white' | 'pale-yellow' | 'dark-green' | 'blood-streaked'
    easeOfClearance: number // 1-5
    // Infection Screen
    fever: boolean // >38°C
    malaise: boolean
    hasHemoptysis: boolean
}

export interface ILDData {
    patientId: string
    logDate: string
    // Fibrosis & Progression Monitor
    breathlessnessChange: 'better' | 'same' | 'worse'
    dryCoughSeverity: number // VAS 0-10
    fatigueLevel: number // VAS 0-10
    // Oxygen Dependency
    restOxygen: number // L/min
    exertionalOxygen: number // L/min
    oxygenIncrease: boolean
    // Red Flags
    newChestPain: boolean
    suddenSpo2Drop: boolean // >4%
    spo2BaselineDrop: number
}

export interface PostInfectionData extends BronchiectasisData {
    // Recovery Tracking
    exerciseToleranceImprovement: boolean
    appetite: 'poor' | 'fair' | 'good'
    weightChange: number // ± kg
    // Post-Infection Complications
    persistentCough: boolean // >3 weeks
    hemoptysis: boolean
}

// Alert System
export interface Alert {
    id: string
    patientId: string
    doctorId: string
    type?: 'critical' | 'high-risk' | 'pending-review'
    level?: 'RED' | 'YELLOW' | 'low' | 'moderate' | 'high' | 'critical'
    message: string
    reason_text?: string
    factors?: string[]
    redFlagScore?: number
    createdAt?: string
    created_at?: string
    acknowledged: boolean
    diseaseType?: DiseaseType
    disease_type?: string
}

// Patient Folder Display
export interface PatientFolder {
    patientId: string
    fullName: string
    age: number
    diseaseType: DiseaseType
    lastLogDate: string
    folderColor: FolderColor
    redFlagScore: number
    alertCount: number
    doctorId: string
}

// Export Data Options
export interface ExportOptions {
    patientIds: string[]
    diseaseSpecific: boolean
    dateRange: {
        start: string
        end: string
    }
    frequency: 'daily' | 'weekly' | 'monthly'
    format: 'csv' | 'excel' | 'pdf'
    includeGraphs: boolean
}

// AQI Data
export interface AQIData {
    aqi: number
    pm25: number
    pm10: number
    location: string
    category: string
    healthImplications: string
    fetchedAt: string
    coordinates?: [number, number]
}

// Medication Types for Prescription
export type MedicationType = 'Injection' | 'Tablet' | 'Capsule' | 'Nebulisation' | 'Inhaler' | 'Nasal Spray'

export interface PrescribedMedication {
    id: string
    serialNo: number
    type: MedicationType
    drugName: string
    dose: string
    startDate: string
    endDate?: string
    patientId: string
    doctorId: string
    isActive: boolean
}

// Doctor Profile
export interface DoctorProfile {
    id: string
    full_name: string
    email?: string
    phone?: string
    specialization?: string
    hospital_affiliation?: string
    license_number?: string
    approval_status: 'pending' | 'approved' | 'rejected'
}

// Patient Profile for Settings
export interface PatientProfile {
    id: string
    full_name: string
    email?: string
    phone?: string
    patient_data?: {
        age?: number
        diagnosis?: {
            primaryCategory?: string
        }
    }
}

// Doctor Instructions
export interface DoctorInstruction {
    id: string
    patientId: string
    doctorId: string
    instruction: string
    createdAt: string
    isActive: boolean
}