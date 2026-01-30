// Prescription Generation and Management Service
import { Prescription, PrescriptionMedication, PersonalizedAlert, PatientData } from './patient-types'

const PRESCRIPTIONS_STORAGE_KEY = 'doctor_prescriptions'

// Generate prescription from patient data (patientId = actual patient id e.g. from credentials)
export function generatePrescription(
    patientData: PatientData,
    patientId: string,
    doctorId: string,
    doctorName: string,
    personalizedAlerts: PersonalizedAlert[] = [],
    instructions?: string
): Prescription {
    const prescription: Prescription = {
        id: `prescription-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId,
        doctorId,
        patientName: patientData.fullName,
        doctorName,
        date: new Date().toISOString().split('T')[0],
        medications: patientData.medications
            .filter(med => med.isActive)
            .map(med => ({
                drugName: med.customDrugName || med.drugName,
                dose: med.dose,
                frequency: med.frequency,
                instructions: `Route: ${med.route}`
            })),
        personalizedAlerts,
        diagnosis: `${patientData.diagnosis.primaryCategory}${patientData.diagnosis.subtype ? ' - ' + (patientData.diagnosis.subtype === 'Others' && patientData.diagnosis.customSubtype ? patientData.diagnosis.customSubtype : patientData.diagnosis.subtype) : ''}`,
        instructions
    }

    storePrescription(prescription)
    return prescription
}

// Store prescription in localStorage
function storePrescription(prescription: Prescription): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY)
        const prescriptions: Prescription[] = stored ? JSON.parse(stored) : []
        prescriptions.push(prescription)
        localStorage.setItem(PRESCRIPTIONS_STORAGE_KEY, JSON.stringify(prescriptions))
    } catch (error) {
        console.error('Error storing prescription:', error)
    }
}

// Get all prescriptions for a doctor
export function getDoctorPrescriptions(doctorId: string): Prescription[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY)
        const prescriptions: Prescription[] = stored ? JSON.parse(stored) : []
        return prescriptions.filter(prescription => prescription.doctorId === doctorId)
    } catch (error) {
        console.error('Error getting doctor prescriptions:', error)
        return []
    }
}

// Get all prescriptions for a patient
export function getPatientPrescriptions(patientId: string): Prescription[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY)
        const prescriptions: Prescription[] = stored ? JSON.parse(stored) : []
        return prescriptions.filter(prescription => prescription.patientId === patientId)
    } catch (error) {
        console.error('Error getting patient prescriptions:', error)
        return []
    }
}

// Get prescriptions by date range for a doctor
export function getDoctorPrescriptionsByDate(doctorId: string, startDate: string, endDate: string): Prescription[] {
    const prescriptions = getDoctorPrescriptions(doctorId)
    return prescriptions.filter(prescription =>
        prescription.date >= startDate && prescription.date <= endDate
    )
}

// Format prescription for display/printing
export function formatPrescriptionCard(prescription: Prescription): string {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    let prescriptionText = `
PRESCRIPTION CARD
================

Date: ${formatDate(prescription.date)}
Doctor: ${prescription.doctorName}
Patient: ${prescription.patientName}
Diagnosis: ${prescription.diagnosis}

MEDICATIONS:
-----------
`

    prescription.medications.forEach((med, index) => {
        prescriptionText += `${index + 1}. ${med.drugName}
   Dose: ${med.dose}
   Frequency: ${med.frequency}
   ${med.instructions ? 'Instructions: ' + med.instructions : ''}

`
    })

    if (prescription.personalizedAlerts.length > 0) {
        prescriptionText += `
PERSONALIZED ALERTS:
-------------------
`
        prescription.personalizedAlerts.forEach((alert, index) => {
            prescriptionText += `${index + 1}. ${alert.name}
   Frequency: ${alert.frequency}${alert.interval ? ' ' + alert.interval : ''}
   ${alert.instructions ? 'Instructions: ' + alert.instructions : ''}

`
        })
    }

    if (prescription.instructions) {
        prescriptionText += `
ADDITIONAL INSTRUCTIONS:
-----------------------
${prescription.instructions}
`
    }

    prescriptionText += `
================
Generated on: ${formatDate(new Date().toISOString())}
`

    return prescriptionText
}

// Create folder structure for prescriptions
export function createPrescriptionFolders(prescription: Prescription): {
    doctorFolder: string
    patientFolder: string
} {
    const date = new Date(prescription.date)
    const dateFolder = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    return {
        doctorFolder: `Doctor-${prescription.doctorId}/Prescriptions/${dateFolder}`,
        patientFolder: `Patient-${prescription.patientId}/Prescriptions`
    }
}

// Export prescription data for Excel
export function exportPrescriptionsToExcel(prescriptions: Prescription[]): any[] {
    return prescriptions.map(prescription => ({
        Date: prescription.date,
        'Patient Name': prescription.patientName,
        'Patient ID': prescription.patientId,
        Diagnosis: prescription.diagnosis,
        'Medications Count': prescription.medications.length,
        Medications: prescription.medications.map(med =>
            `${med.drugName} - ${med.dose} - ${med.frequency}`
        ).join('; '),
        'Personalized Alerts': prescription.personalizedAlerts.map(alert =>
            `${alert.name} - ${alert.frequency}${alert.interval ? ' ' + alert.interval : ''}`
        ).join('; '),
        Instructions: prescription.instructions || ''
    }))
}