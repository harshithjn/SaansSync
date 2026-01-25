// Patient Vitals Management System
import { PatientVitals } from './patient-types'

// Storage key for patient vitals
const PATIENT_VITALS_KEY = 'patient_vitals'

// Get patient vitals by patient ID
export const getPatientVitals = (patientId: string): PatientVitals | null => {
    if (typeof window === 'undefined') return null

    try {
        const stored = localStorage.getItem(`${PATIENT_VITALS_KEY}_${patientId}`)
        return stored ? JSON.parse(stored) : null
    } catch (error) {
        console.error('Error reading patient vitals:', error)
        return null
    }
}

// Store patient vitals
export const storePatientVitals = (patientId: string, vitals: PatientVitals): void => {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(`${PATIENT_VITALS_KEY}_${patientId}`, JSON.stringify(vitals))
        console.log('Patient vitals stored successfully for:', patientId)
    } catch (error) {
        console.error('Error storing patient vitals:', error)
    }
}

// Update respiratory status
export const updateRespiratoryStatus = (
    patientId: string, 
    status: {
        isStatic: boolean
        hasWorsening: boolean
        hasImprovement: boolean
        oxygenIncreaseAmount?: string
        oxygenDecreaseAmount?: string
    }
): void => {
    const currentVitals = getPatientVitals(patientId)
    
    const updatedVitals: PatientVitals = {
        spo2: currentVitals?.spo2 || "",
        respiratoryStatus: {
            isStatic: status.isStatic,
            hasWorsening: status.hasWorsening,
            hasImprovement: status.hasImprovement,
            oxygenIncreaseAmount: status.oxygenIncreaseAmount || "",
            oxygenDecreaseAmount: status.oxygenDecreaseAmount || "",
            baselineOxygen: currentVitals?.respiratoryStatus.baselineOxygen || "0",
            lastUpdated: new Date().toISOString()
        }
    }

    storePatientVitals(patientId, updatedVitals)
}

// Check for oxygen requirement alert (>4L increase for >3 hours)
export const checkOxygenAlert = (patientId: string): boolean => {
    const vitals = getPatientVitals(patientId)
    if (!vitals || !vitals.respiratoryStatus.hasWorsening) return false

    const increaseAmount = parseFloat(vitals.respiratoryStatus.oxygenIncreaseAmount)
    const lastUpdated = new Date(vitals.respiratoryStatus.lastUpdated)
    const now = new Date()
    const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

    return increaseAmount > 4 && hoursDiff > 3
}

// Initialize default vitals for new patient
export const initializePatientVitals = (patientId: string): void => {
    const defaultVitals: PatientVitals = {
        spo2: "",
        respiratoryStatus: {
            isStatic: true,
            hasWorsening: false,
            hasImprovement: false,
            oxygenIncreaseAmount: "",
            oxygenDecreaseAmount: "",
            baselineOxygen: "0",
            lastUpdated: new Date().toISOString()
        }
    }

    storePatientVitals(patientId, defaultVitals)
}