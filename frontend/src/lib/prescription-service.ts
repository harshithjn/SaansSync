// Professional Database-Driven Prescription Service - NO localStorage
import { supabase } from './supabase'
import { requireApprovedDoctor } from './session-manager'
import { Prescription, PrescriptionMedication, PersonalizedAlert, PatientData } from './patient-types'

// =====================================================
// DATABASE-ONLY PRESCRIPTION MANAGEMENT
// =====================================================

/**
 * Generate and store prescription in database
 */
export async function generatePrescription(
    patientData: PatientData,
    patientId: string,
    doctorId: string,
    doctorName: string,
    personalizedAlerts: PersonalizedAlert[] = [],
    instructions?: string
): Promise<Prescription | null> {
    try {
        // Verify doctor is approved (server-side validation)
        await requireApprovedDoctor()

        const prescription = {
            patient_id: patientId,
            doctor_id: doctorId,
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

        const { data, error } = await supabase
            .from('prescriptions')
            .insert(prescription)
            .select()
            .single()

        if (error) {
            console.error('❌ Generate prescription error:', error)
            return null
        }

        console.log('✅ Prescription generated successfully')
        
        // Return in legacy format for compatibility
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
        console.error('❌ Generate prescription error:', error)
        return null
    }
}

/**
 * Get prescriptions by doctor (server-side validated)
 */
export async function getDoctorPrescriptions(doctorId: string): Promise<Prescription[]> {
    try {
        const { data, error } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('❌ Get doctor prescriptions error:', error)
            return []
        }

        // Convert to legacy format
        return (data || []).map(convertToLegacyFormat)
    } catch (error) {
        console.error('❌ Get doctor prescriptions error:', error)
        return []
    }
}

/**
 * Get prescriptions by patient (server-side validated)
 */
export async function getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
    try {
        const { data, error } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('❌ Get patient prescriptions error:', error)
            return []
        }

        // Convert to legacy format
        return (data || []).map(convertToLegacyFormat)
    } catch (error) {
        console.error('❌ Get patient prescriptions error:', error)
        return []
    }
}

/**
 * Get prescriptions by date range for a doctor
 */
export async function getDoctorPrescriptionsByDate(doctorId: string, startDate: string, endDate: string): Promise<Prescription[]> {
    try {
        const { data, error } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('doctor_id', doctorId)
            .gte('prescription_date', startDate)
            .lte('prescription_date', endDate)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('❌ Get doctor prescriptions by date error:', error)
            return []
        }

        return (data || []).map(convertToLegacyFormat)
    } catch (error) {
        console.error('❌ Get doctor prescriptions by date error:', error)
        return []
    }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Convert database format to legacy format for compatibility
 */
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

/**
 * Format prescription for display/printing
 */
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

/**
 * Create folder structure for prescriptions
 */
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

/**
 * Export prescription data for Excel
 */
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