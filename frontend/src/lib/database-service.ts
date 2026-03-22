// Database Service - BFF backed (no direct Supabase)
import api from './api'
import { LoginResponse } from './auth-types'
import { getDoctorAlertCounts, searchPatients } from "./doctor-patient-mapping"
import { DiseaseType, PatientFolder } from './monitoring-types'

// Map frontend disease categories to database disease types
const mapDiseaseTypeToDatabase = (frontendCategory: string): string => {
  const mapping: { [key: string]: string } = {
    'Interstitial Lung Disease (ILD)': 'ILD',
    'Bronchial Asthma': 'Asthma',
    'COPD (Chronic Obstructive Pulmonary Disease)': 'COPD',
    'Bronchiectasis': 'Bronchiectasis',
    'Post ICU Recovery': 'Post-Infection'
  }
  return mapping[frontendCategory] || frontendCategory
}

// =====================================================
// DOCTOR FUNCTIONS
// =====================================================

export async function createDoctorProfile(
  fullName: string,
  licenseNumber: string,
  specialization: string,
  hospitalAffiliation: string,
  email?: string
) {
  try {
    const result = await api.post('/doctor/profile', {
      fullName,
      licenseNumber,
      specialization,
      hospitalAffiliation
    })
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function createPatientAccount(
  email: string,
  password: string,
  fullName: string,
  diseaseType: DiseaseType,
  doctorId?: string,
  patientData?: any
) {
  try {
    const dbDiseaseType = mapDiseaseTypeToDatabase(diseaseType)
    const result = await api.post('/patient', {
      email,
      password,
      fullName,
      diseaseType: dbDiseaseType,
      doctorId,
      patientData
    })
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// =====================================================
// AUTHENTICATION FUNCTIONS
// =====================================================

export async function loginPatient(email: string, password: string): Promise<LoginResponse> {
  try {
    const data = await api.post<LoginResponse>('/auth/patient/login', { email, password })
    return data
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// =====================================================
// DAILY LOGGING FUNCTIONS
// =====================================================

export async function canLogToday(patientId: string): Promise<boolean> {
  try {
    const data = await api.get<{ canLog: boolean }>(`/patient/${patientId}/can-log`)
    return data?.canLog ?? false
  } catch {
    return false
  }
}

export async function createDailyLog(
  patientId: string,
  diseaseType: DiseaseType,
  commonData: any,
  diseaseSpecificData: any
): Promise<{ success: boolean; logEntry?: any; alert?: any; error?: string }> {
  try {
    const result = await api.post<any>('/logs', {
      patientId,
      diseaseType: mapDiseaseTypeToDatabase(diseaseType),
      commonData,
      diseaseSpecificData
    })
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// =====================================================
// ALERT FUNCTIONS
// =====================================================

export async function getPatientAlerts(patientId: string) {
  try {
    const data = await api.get<{ alerts: any[] }>(`/alerts?patientId=${patientId}`)
    return data?.alerts || []
  } catch (error) {
    return []
  }
}

export async function getDoctorPatients(doctorId: string) {
  try {
    const data = await api.get<any[]>(`/doctor/${doctorId}/patients`)
    return data || []
  } catch (error) {
    return []
  }
}

export async function getDoctorPatientFolders(doctorId: string): Promise<PatientFolder[]> {
  try {
    const data = await api.get<PatientFolder[]>(`/doctor/${doctorId}/patient-folders`)
    return data || []
  } catch (error) {
    return []
  }
}

export async function getDoctorDailyLogs(doctorId: string) {
  try {
    const data = await api.get<any[]>(`/doctor/${doctorId}/logs`)
    return data || []
  } catch (error) {
    return []
  }
}

export async function getDoctorAlerts(doctorId: string) {
  try {
    const data = await api.get<any[]>(`/doctor/${doctorId}/alerts`)
    return data || []
  } catch (error) {
    return []
  }
}

export async function getDoctorProfile(doctorId: string) {
  try {
    const data = await api.get<any>(`/doctor/${doctorId}`)
    return data || null
  } catch (error) {
    return null
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function getPatientDailyLogs(patientId: string) {
  try {
    const data = await api.get<any[]>(`/patient/${patientId}/logs`)
    return data || []
  } catch {
    return []
  }
}

export async function getPatientMedications(patientId: string) {
  try {
    const data = await api.get<any[]>(`/patient/${patientId}/medications`)
    return data || []
  } catch {
    return []
  }
}

export async function getPatientReports(patientId: string) {
  try {
    const data = await api.get<{ pftRecords: any[], reports: any[] }>(`/patient/${patientId}/reports`)
    return data || { pftRecords: [], reports: [] }
  } catch {
    return { pftRecords: [], reports: [] }
  }
}

export async function getPatientProfile(patientId: string) {
  try {
    const data = await api.get<any>(`/patient/${patientId}`)
    return data || null
  } catch {
    return null
  }
}

export async function acknowledgeAlert(alertId: string) {
  try {
    const data = await api.post<{ success: boolean; error?: string }>(`/alerts/${alertId}/ack`)
    return data
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function getPatientInstructions(patientId: string) {
  try {
    const data = await api.get<any[]>(`/patient/${patientId}/instructions`)
    return data || []
  } catch {
    return []
  }
}

export async function addPatientInstruction(patientId: string, doctorId: string, instruction: string) {
  try {
    const data = await api.post<any>(`/patient/${patientId}/instructions`, { doctorId, instruction })
    return data
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function updatePatientData(patientId: string, fullName: string, patientData: any) {
  try {
    const data = await api.put<any>(`/patient/${patientId}`, {
      full_name: fullName,
      patient_data: patientData
    })
    return data
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function getPatientTrends(patientId: string, days: number = 7) {
  try {
    const data = await api.get<any[]>(`/patient/${patientId}/logs?days=${days}`)
    return data || []
  } catch (error) {
    return []
  }
}
