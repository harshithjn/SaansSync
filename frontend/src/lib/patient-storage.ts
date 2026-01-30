// Patient Storage System
// In production, this would be replaced with proper database operations

import { PatientCredentials, AuthSession } from './auth-types'
import { PatientData } from './patient-types'

export interface StoredPatient {
    credentials: PatientCredentials
    patientData: PatientData
    createdAt: string
    updatedAt: string
}

// Storage keys
const PATIENTS_STORAGE_KEY = 'stored_patients'
const CREDENTIALS_STORAGE_KEY = 'patient_credentials'

// Get all stored patients
export const getStoredPatients = (): StoredPatient[] => {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(PATIENTS_STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error('Error reading stored patients:', error)
        return []
    }
}

// Store a new patient
export const storePatient = (credentials: PatientCredentials, patientData: PatientData): void => {
    if (typeof window === 'undefined') return

    try {
        const existingPatients = getStoredPatients()

        // Check if patient already exists (by email)
        const existingIndex = existingPatients.findIndex(p => p.credentials.email === credentials.email)

        const newPatient: StoredPatient = {
            credentials,
            patientData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        if (existingIndex >= 0) {
            // Update existing patient
            existingPatients[existingIndex] = {
                ...newPatient,
                createdAt: existingPatients[existingIndex].createdAt
            }
        } else {
            // Add new patient
            existingPatients.push(newPatient)
        }

        localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(existingPatients))
        console.log('Patient stored successfully:', credentials.email)
    } catch (error) {
        console.error('Error storing patient:', error)
    }
}

// Find patient by email
export const findPatientByEmail = (email: string): StoredPatient | null => {
    const patients = getStoredPatients()
    return patients.find(p => p.credentials.email.toLowerCase() === email.toLowerCase()) || null
}

// Find patient by ID
export const findPatientById = (patientId: string): StoredPatient | null => {
    const patients = getStoredPatients()
    return patients.find(p => p.credentials.patientId === patientId) || null
}

// Get patient credentials for login
export const getPatientCredentials = (): PatientCredentials[] => {
    const patients = getStoredPatients()
    return patients.map(p => p.credentials)
}

// Get patient data for login (returns array)
export const getPatientDataArray = (): PatientData[] => {
    const patients = getStoredPatients()
    return patients.map(p => p.patientData)
}

// Initialize with demo patients if no patients exist
export const initializeDemoPatients = (): void => {
    if (typeof window === 'undefined') return

    // Only initialize if no patients exist
    const existingPatients = getStoredPatients()
    if (existingPatients.length > 0) {
        console.log('Patients already exist, skipping demo initialization')
        return
    }

    console.log('No patients found, initializing demo patients')

    // Import required functions
    import('./auth-utils').then(({ createPatientCredentials }) => {
        import('./doctor-patient-mapping').then(({ createPatientFolder }) => {
            // Create demo patients
            const demoPatients = [
                {
                    email: "john.doe@example.com",
                    fullName: "John Doe",
                    age: "45",
                    sex: "Male",
                    mobileNumber: "9876543210",
                    primaryDiagnosisCategory: "Interstitial Lung Disease (ILD)",
                    subtype: "UIP"
                },
                {
                    email: "jane.smith@example.com",
                    fullName: "Jane Smith",
                    age: "52",
                    sex: "Female",
                    mobileNumber: "9876543211",
                    primaryDiagnosisCategory: "Bronchial Asthma",
                    subtype: "Moderate persistent asthma"
                },
                {
                    email: "mike.johnson@example.com",
                    fullName: "Mike Johnson",
                    age: "58",
                    sex: "Male",
                    mobileNumber: "9876543212",
                    primaryDiagnosisCategory: "COPD (Chronic Obstructive Pulmonary Disease)",
                    subtype: "Moderate COPD"
                },
                {
                    email: "bob.wilson@example.com",
                    fullName: "Bob Wilson",
                    age: "38",
                    sex: "Male",
                    mobileNumber: "9876543213",
                    primaryDiagnosisCategory: "Bronchiectasis",
                    subtype: "Idiopathic"
                },
                {
                    email: "alice.brown@example.com",
                    fullName: "Alice Brown",
                    age: "41",
                    sex: "Female",
                    mobileNumber: "9876543214",
                    primaryDiagnosisCategory: "Post ICU Recovery",
                    subtype: "ARDS Recovery"
                }
            ]

            demoPatients.forEach(demo => {
                const credentials = createPatientCredentials(demo.email)

                const patientData: PatientData = {
                    fullName: demo.fullName,
                    mobileNumber: demo.mobileNumber,
                    emailId: demo.email,
                    age: demo.age,
                    sex: demo.sex,
                    registrationDate: new Date().toISOString().split('T')[0],
                    diagnosis: {
                        primaryCategory: demo.primaryDiagnosisCategory,
                        subtype: demo.subtype,
                        ctdType: "",
                        sarcoidosisStage: ""
                    },
                    medicalHistory: "Demo patient for testing",
                    comorbidities: [],
                    customComorbidity: "",
                    occupationalExposure: "",
                    additionalNotes: "",
                    smokingStatus: "Never Smoked",
                    packYears: "",
                    medications: [],
                    pftRecords: [],
                    requiresRespiratorySupport: "No",
                    ltot: { enabled: false, oxygenLitres: "" },
                    bipap: {
                        enabled: false,
                        overnightUse: false,
                        allTimeUse: false,
                        requiresOxygen: false,
                        oxygenLitres: "",
                        ipap: "",
                        epap: "",
                        pressureSupport: "",
                        respiratoryRate: ""
                    },
                    invasiveVentilation: {
                        enabled: false,
                        ipap: "",
                        epap: "",
                        pressureSupport: "",
                        respiratoryRate: "",
                        fiO2: ""
                    },
                    tracheostomy: {
                        enabled: false,
                        airwayPatencyRequired: true,
                        oxygenViaTrach: false,
                        oxygenLitres: "",
                        requiresVentilator: false,
                        ipap: "",
                        epap: "",
                        pressureSupport: "",
                        respiratoryRate: "",
                        tidalVolume: "",
                        fiO2: ""
                    }
                }

                storePatient(credentials, patientData)

                // Also create patient folder for demo doctor
                createPatientFolder(patientData, "doctor@gmail.com", credentials.patientId, Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 3))
            })

            console.log('Demo patients initialized successfully')
        })
    })
}

// Clear all stored patients (for testing)
export const clearStoredPatients = (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(PATIENTS_STORAGE_KEY)
    console.log('All stored patients cleared')
}

// Force reinitialize demo patients (for testing)
export const forceInitializeDemoPatients = (): void => {
    if (typeof window === 'undefined') return
    
    clearStoredPatients()
    console.log('Forcing demo patient initialization...')
    
    // Import required functions
    import('./auth-utils').then(({ createPatientCredentials }) => {
        import('./doctor-patient-mapping').then(({ createPatientFolder }) => {
            // Create demo patients
            const demoPatients = [
                {
                    email: "john.doe@example.com",
                    fullName: "John Doe",
                    age: "45",
                    sex: "Male",
                    mobileNumber: "9876543210",
                    primaryDiagnosisCategory: "Interstitial Lung Disease (ILD)",
                    subtype: "UIP"
                },
                {
                    email: "jane.smith@example.com",
                    fullName: "Jane Smith",
                    age: "52",
                    sex: "Female",
                    mobileNumber: "9876543211",
                    primaryDiagnosisCategory: "Bronchial Asthma",
                    subtype: "Moderate persistent asthma"
                },
                {
                    email: "mike.johnson@example.com",
                    fullName: "Mike Johnson",
                    age: "58",
                    sex: "Male",
                    mobileNumber: "9876543212",
                    primaryDiagnosisCategory: "COPD (Chronic Obstructive Pulmonary Disease)",
                    subtype: "Moderate COPD"
                },
                {
                    email: "bob.wilson@example.com",
                    fullName: "Bob Wilson",
                    age: "38",
                    sex: "Male",
                    mobileNumber: "9876543213",
                    primaryDiagnosisCategory: "Bronchiectasis",
                    subtype: "Idiopathic"
                },
                {
                    email: "alice.brown@example.com",
                    fullName: "Alice Brown",
                    age: "41",
                    sex: "Female",
                    mobileNumber: "9876543214",
                    primaryDiagnosisCategory: "Post ICU Recovery",
                    subtype: "ARDS Recovery"
                }
            ]

            demoPatients.forEach(demo => {
                const credentials = createPatientCredentials(demo.email)

                const patientData: PatientData = {
                    fullName: demo.fullName,
                    mobileNumber: demo.mobileNumber,
                    emailId: demo.email,
                    age: demo.age,
                    sex: demo.sex,
                    registrationDate: new Date().toISOString().split('T')[0],
                    diagnosis: {
                        primaryCategory: demo.primaryDiagnosisCategory,
                        subtype: demo.subtype,
                        ctdType: "",
                        sarcoidosisStage: ""
                    },
                    medicalHistory: "Demo patient for testing",
                    comorbidities: [],
                    customComorbidity: "",
                    occupationalExposure: "",
                    additionalNotes: "",
                    smokingStatus: "Never Smoked",
                    packYears: "",
                    medications: [],
                    pftRecords: [],
                    requiresRespiratorySupport: "No",
                    ltot: { enabled: false, oxygenLitres: "" },
                    bipap: {
                        enabled: false,
                        overnightUse: false,
                        allTimeUse: false,
                        requiresOxygen: false,
                        oxygenLitres: "",
                        ipap: "",
                        epap: "",
                        pressureSupport: "",
                        respiratoryRate: ""
                    },
                    invasiveVentilation: {
                        enabled: false,
                        ipap: "",
                        epap: "",
                        pressureSupport: "",
                        respiratoryRate: "",
                        fiO2: ""
                    },
                    tracheostomy: {
                        enabled: false,
                        airwayPatencyRequired: true,
                        oxygenViaTrach: false,
                        oxygenLitres: "",
                        requiresVentilator: false,
                        ipap: "",
                        epap: "",
                        pressureSupport: "",
                        respiratoryRate: "",
                        tidalVolume: "",
                        fiO2: ""
                    }
                }

                storePatient(credentials, patientData)

                // Also create patient folder for demo doctor
                createPatientFolder(patientData, "doctor@gmail.com", credentials.patientId, Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 3))
            })

            console.log('Demo patients force initialized successfully')
        })
    })
}

// Get patient count
export const getPatientCount = (): number => {
    return getStoredPatients().length
}

// Update patient data
export const updatePatientData = (patientId: string, updatedData: PatientData): boolean => {
    if (typeof window === 'undefined') return false

    try {
        const patients = getStoredPatients()
        const patientIndex = patients.findIndex(p => p.credentials.patientId === patientId)

        if (patientIndex >= 0) {
            patients[patientIndex].patientData = updatedData
            patients[patientIndex].updatedAt = new Date().toISOString()
            localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patients))
            console.log('Patient data updated successfully:', patientId)
            return true
        }

        console.error('Patient not found for update:', patientId)
        return false
    } catch (error) {
        console.error('Error updating patient data:', error)
        return false
    }
}

// Get single patient data by ID
export const getPatientDataById = (patientId: string): PatientData | null => {
    const patient = findPatientById(patientId)
    return patient ? patient.patientData : null
}