// Professional Database-Driven Prescription Service - BFF only
import api from './api'
import { requireApprovedDoctor } from './session-manager'
import { Prescription, PersonalizedAlert, PatientData } from './patient-types'
import { formatDate } from './utils'

// =====================================================
// DATABASE-ONLY PRESCRIPTION MANAGEMENT
// =====================================================

export async function generatePrescription(
  patientData: PatientData,
  patientId: string,
  doctorId: string,
  doctorName: string,
  personalizedAlerts: PersonalizedAlert[] = [],
  instructions?: string
): Promise<Prescription | null> {
  try {
    await requireApprovedDoctor()

    const payload = {
      patient_id: patientId,
      doctor_id: doctorId,
      patient_name: patientData.fullName,
      doctor_name: doctorName,
      prescription_date: new Date().toISOString().split('T')[0],
      medications: patientData.medications
        .filter(med => med.isActive)
        .map(med => ({
          drugName: med.customDrugName || med.drugName,
          dose: med.dose,
          frequency: med.frequency,
          instructions: `Route: ${med.route}`
        })),
      diagnosis: `${patientData.diagnosis.primaryCategory}${patientData.diagnosis.subtype ? ' - ' + (patientData.diagnosis.subtype === 'Others' && patientData.diagnosis.customSubtype ? patientData.diagnosis.customSubtype : patientData.diagnosis.subtype) : ''}`,
      instructions,
      notes: JSON.stringify({
        patientName: patientData.fullName,
        doctorName,
        personalizedAlerts
      })
    }

    const resp = await api.post<any>('/prescriptions', payload)
    const data = resp?.prescription || resp
    if (!data) return null

    return {
      id: data.id,
      patientId,
      doctorId,
      patientName: patientData.fullName,
      doctorName,
      date: data.prescription_date,
      medications: data.medications,
      personalizedAlerts,
      diagnosis: data.diagnosis,
      instructions: data.instructions
    }
  } catch (error) {
    console.error('Generate prescription error:', error)
    return null
  }
}

export async function getDoctorPrescriptions(doctorId: string): Promise<Prescription[]> {
  try {
    const resp = await api.get<{ prescriptions: any[] }>(`/prescriptions?doctorId=${doctorId}`)
    return (resp?.prescriptions || []).map(convertToLegacyFormat)
  } catch (error) {
    return []
  }
}

export async function getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
  try {
    const resp = await api.get<{ prescriptions: any[] }>(`/prescriptions?patientId=${patientId}`)
    return (resp?.prescriptions || []).map(convertToLegacyFormat)
  } catch (error) {
    return []
  }
}

export async function getDoctorPrescriptionsByDate(doctorId: string, startDate: string, endDate: string): Promise<Prescription[]> {
  try {
    const resp = await api.get<{ prescriptions: any[] }>(`/prescriptions?doctorId=${doctorId}&startDate=${startDate}&endDate=${endDate}`)
    return (resp?.prescriptions || []).map(convertToLegacyFormat)
  } catch (error) {
    return []
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function convertToLegacyFormat(dbPrescription: any): Prescription {
  const notes = dbPrescription.notes ? JSON.parse(dbPrescription.notes) : {}

  return {
    id: dbPrescription.id,
    patientId: dbPrescription.patient_id,
    doctorId: dbPrescription.doctor_id,
    patientName: notes.patientName || 'Unknown Patient',
    doctorName: notes.doctorName || 'Unknown Doctor',
    date: dbPrescription.prescription_date,
    medications: dbPrescription.medications || [],
    personalizedAlerts: notes.personalizedAlerts || [],
    diagnosis: dbPrescription.diagnosis || '',
    instructions: dbPrescription.instructions || ''
  }
}

// =====================================================
// Formatting helpers unchanged
// =====================================================

export function formatPrescriptionCard(prescription: Prescription): string {

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
