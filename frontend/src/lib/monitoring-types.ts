export type DiseaseType = 'Asthma' | 'COPD' | 'ILD' | 'Bronchiectasis' | 'Post-Infection'

export type AlertLevel = 'low' | 'moderate' | 'high' | 'critical'
export type FolderColor = 'green' | 'yellow' | 'orange' | 'red'

export interface DoctorPatientMapping {
    doctorId: string
    patientId: string
    createdAt: string
    diseaseType: DiseaseType
}

export interface RedFlagScore {
    patientId: string
    score: number
    level: AlertLevel
    factors: string[]
    calculatedAt: string
    diseaseSpecificFactors: any
}

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
    mMRCScale: number
    medications: PatientMedicationLog[]
    sideEffects: string[]
    customSideEffect?: string
    symptoms: SymptomVAS[]
}

export interface PatientMedicationLog {
    medicationId: string
    drugName: string
    dose: string
    frequency: string
    dateTaken: string
    taken: boolean
    sideEffects?: string[]
}

export interface SymptomVAS {
    id: string
    name: string
    score: number
    previousScore?: number
    loggedAt: string
}

export interface AsthmaData {
    patientId: string
    logDate: string

    daytimeSymptoms: boolean
    nightWaking: boolean
    relieverUse: boolean
    activityLimitation: boolean
    controlLevel: 'well-controlled' | 'partly-controlled' | 'uncontrolled'

    rescueInhalerPuffs: number
    peakFlow: number
    peakFlowPercent?: number
}

export interface COPDData {
    patientId: string
    logDate: string

    coughFrequency: number
    phlegmProduction: number
    exerciseTolerance: boolean
    sleepDisturbed: boolean

    energyLevel: number
    chestHeaviness: number

    dailyStepCount?: number
    sputumVolume: 'none' | 'small' | 'moderate' | 'large'
    sputumColor: string
    fever: boolean
}

export interface BronchiectasisData {
    patientId: string
    logDate: string

    sputumVolume: 'none' | 'small' | 'moderate' | 'large'
    sputumColor: 'white' | 'pale-yellow' | 'dark-green' | 'blood-streaked'
    easeOfClearance: number

    fever: boolean
    malaise: boolean
    hasHemoptysis: boolean
}

export interface ILDData {
    patientId: string
    logDate: string

    breathlessnessChange: 'better' | 'same' | 'worse'
    dryCoughSeverity: number
    fatigueLevel: number

    restOxygen: number
    exertionalOxygen: number
    oxygenIncrease: boolean

    newChestPain: boolean
    suddenSpo2Drop: boolean
    spo2BaselineDrop: number
}

export interface PostInfectionData extends BronchiectasisData {

    exerciseToleranceImprovement: boolean
    appetite: 'poor' | 'fair' | 'good'
    weightChange: number

    persistentCough: boolean
    hemoptysis: boolean
}

export interface Alert {
    id: string
    patientId: string
    doctorId: string
    type?: 'critical' | 'high-risk' | 'pending-review'
    level?: 'RED' | 'YELLOW' | 'low' | 'moderate' | 'high' | 'critical'
    message: string
    reasonText?: string
    factors?: string[]
    redFlagScore?: number
    createdAt?: string
    acknowledged: boolean
    diseaseType?: DiseaseType
}

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

export interface DoctorProfile {
    id: string
    fullName: string
    email: string
    specialization?: string
    hospitalAffiliation?: string
    licenseNumber?: string
    approvalStatus: 'pending' | 'approved' | 'rejected'
}

export interface PatientProfile {
    id: string
    fullName: string
    email: string
    patientData?: {
        age?: number
        diagnosis?: {
            primaryCategory?: string
        }
    }
}

export interface DoctorInstruction {
    id: string
    patientId: string
    doctorId: string
    instruction: string
    createdAt: string
    isActive: boolean
}