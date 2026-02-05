// Doctor-Patient Mapping Service (BFF + local cache)
import { DoctorPatientMapping, PatientFolder, DiseaseType } from './monitoring-types'
import { PatientData } from './patient-types'
import api from './api'

const MAPPING_STORAGE_KEY = 'doctor_patient_mappings'
const PATIENT_FOLDERS_KEY = 'patient_folders'

// Create mapping when patient is created
export function createDoctorPatientMapping(
  doctorId: string,
  patientId: string,
  diseaseType: DiseaseType
): void {
  if (typeof window === 'undefined') return

  try {
    const mapping: DoctorPatientMapping = {
      doctorId,
      patientId,
      createdAt: new Date().toISOString(),
      diseaseType
    }

    const stored = localStorage.getItem(MAPPING_STORAGE_KEY)
    const mappings: DoctorPatientMapping[] = stored ? JSON.parse(stored) : []

    const existingIndex = mappings.findIndex(m => m.doctorId === doctorId && m.patientId === patientId)

    if (existingIndex >= 0) {
      mappings[existingIndex] = mapping
    } else {
      mappings.push(mapping)
    }

    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(mappings))

    // Persist mapping server-side (fire-and-forget)
    void api.post(`/doctor/${doctorId}/assign-patient`, { patientId, diseaseType }).catch(() => null)
  } catch (error) {
    console.error('Error creating doctor-patient mapping:', error)
  }
}

// Get all patients for a specific doctor (local cache)
export function getDoctorPatients(doctorId: string): DoctorPatientMapping[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(MAPPING_STORAGE_KEY)
    const mappings: DoctorPatientMapping[] = stored ? JSON.parse(stored) : []
    return mappings.filter(mapping => mapping.doctorId === doctorId)
  } catch (error) {
    console.error('Error getting doctor patients:', error)
    return []
  }
}

// Get patient's assigned doctor (local cache)
export function getPatientDoctor(patientId: string): DoctorPatientMapping | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(MAPPING_STORAGE_KEY)
    const mappings: DoctorPatientMapping[] = stored ? JSON.parse(stored) : []
    return mappings.find(mapping => mapping.patientId === patientId) || null
  } catch (error) {
    console.error('Error getting patient doctor:', error)
    return null
  }
}

// Create/Update Patient Folder (server-first + local cache)
export async function createPatientFolderAsync(
  patientData: PatientData,
  doctorId: string,
  patientId: string,
  redFlagScore: number = 1,
  alertCount: number = 0
): Promise<void> {
  if (typeof window === 'undefined') return

  const diseaseType = mapDiagnosisToDisease(patientData.diagnosis.primaryCategory)
  const folderColor = getFolderColorFromScore(redFlagScore)

  try {
    await api.post(`/doctor/${doctorId}/patient-folders`, {
      patientId,
      doctorId,
      fullName: patientData.fullName,
      age: parseInt(patientData.age) || 0,
      diseaseType,
      lastLogDate: new Date().toISOString(),
      folderColor,
      redFlagScore,
      alertCount
    })
  } catch (e) {
    console.warn('Server patient folder upsert failed:', e)
  }

  createPatientFolder(patientData, doctorId, patientId, redFlagScore, alertCount)
}

export function createPatientFolder(
  patientData: PatientData,
  doctorId: string,
  patientId: string,
  redFlagScore: number = 1,
  alertCount: number = 0
): void {
  if (typeof window === 'undefined') return

  try {
    const diseaseType = mapDiagnosisToDisease(patientData.diagnosis.primaryCategory)

    const folder: PatientFolder = {
      patientId,
      fullName: patientData.fullName,
      age: parseInt(patientData.age),
      diseaseType,
      lastLogDate: new Date().toISOString(),
      folderColor: getFolderColorFromScore(redFlagScore),
      redFlagScore,
      alertCount,
      doctorId
    }

    const stored = localStorage.getItem(PATIENT_FOLDERS_KEY)
    const folders: PatientFolder[] = stored ? JSON.parse(stored) : []

    const existingIndex = folders.findIndex(f => f.patientId === folder.patientId)

    if (existingIndex >= 0) {
      folders[existingIndex] = { ...folders[existingIndex], ...folder }
    } else {
      folders.push(folder)
    }

    localStorage.setItem(PATIENT_FOLDERS_KEY, JSON.stringify(folders))
    createDoctorPatientMapping(doctorId, folder.patientId, diseaseType)
  } catch (error) {
    console.error('Error creating patient folder:', error)
  }
}

// Get patient folders for a doctor (server-first)
export async function getDoctorPatientFoldersAsync(doctorId: string): Promise<PatientFolder[]> {
  if (typeof window === 'undefined') return []

  try {
    const data = await api.get<PatientFolder[]>(`/doctor/${doctorId}/patient-folders`)
    if (Array.isArray(data)) {
      localStorage.setItem(PATIENT_FOLDERS_KEY, JSON.stringify(data))
      return data
    }
  } catch {
    // ignore and fall back to cache
  }

  return getDoctorPatientFolders(doctorId)
}

export function getDoctorPatientFolders(doctorId: string): PatientFolder[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(PATIENT_FOLDERS_KEY)
    const folders: PatientFolder[] = stored ? JSON.parse(stored) : []
    return folders.filter(folder => folder.doctorId === doctorId)
  } catch (error) {
    console.error('Error getting doctor patient folders:', error)
    return []
  }
}

// Update patient folder color and score (cache + best-effort server update)
export function updatePatientFolderStatus(
  patientId: string,
  redFlagScore: number,
  alertCount: number
): void {
  if (typeof window === 'undefined') return

  try {
    const stored = localStorage.getItem(PATIENT_FOLDERS_KEY)
    const folders: PatientFolder[] = stored ? JSON.parse(stored) : []

    const folderIndex = folders.findIndex(f => f.patientId === patientId)

    if (folderIndex >= 0) {
      const folder = folders[folderIndex]
      folders[folderIndex] = {
        ...folder,
        redFlagScore,
        alertCount,
        folderColor: getFolderColorFromScore(redFlagScore),
        lastLogDate: new Date().toISOString()
      }

      localStorage.setItem(PATIENT_FOLDERS_KEY, JSON.stringify(folders))

      // best-effort server patch
      void api.patch(`/doctor/${folder.doctorId}/patient-folders/${patientId}`, {
        redFlagScore,
        alertCount,
        folderColor: getFolderColorFromScore(redFlagScore)
      }).catch(() => null)
    }
  } catch (error) {
    console.error('Error updating patient folder status:', error)
  }
}

// Helper function to map diagnosis to disease type
function mapDiagnosisToDisease(primaryCategory: string): DiseaseType {
  switch (primaryCategory) {
    case 'Bronchial Asthma':
      return 'Asthma'
    case 'COPD (Chronic Obstructive Pulmonary Disease)':
      return 'COPD'
    case 'Interstitial Lung Disease (ILD)':
      return 'ILD'
    case 'Bronchiectasis':
      return 'Bronchiectasis'
    case 'Post ICU Recovery':
      return 'Post-Infection'
    default:
      return 'ILD'
  }
}

function getFolderColorFromScore(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 7) return 'red'
  if (score >= 4) return 'yellow'
  return 'green'
}

export function searchPatients(doctorId: string, searchTerm: string): PatientFolder[] {
  const allPatients = getDoctorPatientFolders(doctorId)
  if (!searchTerm.trim()) return allPatients
  const term = searchTerm.toLowerCase()
  return allPatients.filter(patient =>
    patient.fullName.toLowerCase().includes(term) ||
    patient.patientId.toLowerCase().includes(term)
  )
}

export function getDoctorPatientCount(doctorId: string): number {
  return getDoctorPatientFolders(doctorId).length
}

export function getDoctorAlertCounts(doctorId: string): {
  critical: number
  highRisk: number
  pendingReview: number
  total: number
} {
  const patients = getDoctorPatientFolders(doctorId)

  let critical = 0
  let highRisk = 0
  let pendingReview = 0

  patients.forEach(patient => {
    if (patient.redFlagScore >= 9) critical++
    else if (patient.redFlagScore >= 7) highRisk++
    else if (patient.redFlagScore >= 4) pendingReview++
  })

  return {
    critical,
    highRisk,
    pendingReview,
    total: critical + highRisk + pendingReview
  }
}

export function removeDoctorPatientMapping(doctorId: string, patientId: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const mappingStored = localStorage.getItem(MAPPING_STORAGE_KEY)
    const mappings: DoctorPatientMapping[] = mappingStored ? JSON.parse(mappingStored) : []

    const filteredMappings = mappings.filter(m =>
      !(m.doctorId === doctorId && m.patientId === patientId)
    )

    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(filteredMappings))

    const folderStored = localStorage.getItem(PATIENT_FOLDERS_KEY)
    const folders: PatientFolder[] = folderStored ? JSON.parse(folderStored) : []

    const filteredFolders = folders.filter(f =>
      !(f.doctorId === doctorId && f.patientId === patientId)
    )

    localStorage.setItem(PATIENT_FOLDERS_KEY, JSON.stringify(filteredFolders))

    void api.delete(`/doctor/${doctorId}/patient-folders/${patientId}`).catch(() => null)

    console.log('Doctor-Patient mapping removed:', { doctorId, patientId })
    return true
  } catch (error) {
    console.error('Error removing doctor-patient mapping:', error)
    return false
  }
}
