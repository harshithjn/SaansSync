// Doctor-Patient Mapping Service (localStorage + Supabase when doctor is UUID)
import { DoctorPatientMapping, PatientFolder, DiseaseType } from './monitoring-types'
import { PatientData } from './patient-types'
import { supabase, isSupabaseConfigured } from './supabase'
import { isDoctorIdUuid, diagnosisToDiseaseType as mapDiagToDisease } from './supabase-auth'

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
        
        // Check if mapping already exists
        const existingIndex = mappings.findIndex(m => 
            m.doctorId === doctorId && m.patientId === patientId
        )

        if (existingIndex >= 0) {
            mappings[existingIndex] = mapping
        } else {
            mappings.push(mapping)
        }

        localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(mappings))
        console.log('Doctor-Patient mapping created:', mapping)
    } catch (error) {
        console.error('Error creating doctor-patient mapping:', error)
    }
}

// Get all patients for a specific doctor
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

// Get patient's assigned doctor
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

// Create/Update Patient Folder (localStorage + Supabase when doctorId is UUID)
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

    if (isSupabaseConfigured() && supabase && isDoctorIdUuid(doctorId)) {
        try {
            await supabase.from('patient_folders').upsert({
                patient_id: patientId,
                doctor_id: doctorId,
                full_name: patientData.fullName,
                age: parseInt(patientData.age) || 0,
                disease_type: diseaseType,
                last_log_date: new Date().toISOString(),
                folder_color: folderColor,
                red_flag_score: redFlagScore,
                alert_count: alertCount,
                updated_at: new Date().toISOString()
            }, { onConflict: 'patient_id,doctor_id' })
            await supabase.from('doctor_patient_mapping').upsert({
                doctor_id: doctorId,
                patient_id: patientId,
                disease_type: diseaseType
            }, { onConflict: 'doctor_id,patient_id' })
            return
        } catch (e) {
            console.error('Supabase createPatientFolder:', e)
        }
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

// Get patient folders for a doctor (Supabase when doctorId is UUID)
export async function getDoctorPatientFoldersAsync(doctorId: string): Promise<PatientFolder[]> {
    if (typeof window === 'undefined') return []
    if (isSupabaseConfigured() && supabase && isDoctorIdUuid(doctorId)) {
        try {
            const { data, error } = await supabase.from('patient_folders').select('*').eq('doctor_id', doctorId)
            if (error) return []
            return (data ?? []).map((row: Record<string, unknown>) => ({
                patientId: row.patient_id,
                fullName: row.full_name,
                age: Number(row.age ?? 0),
                diseaseType: (row.disease_type as DiseaseType) ?? 'ILD',
                lastLogDate: (row.last_log_date as string) ?? new Date().toISOString(),
                folderColor: (row.folder_color as 'green' | 'yellow' | 'red') ?? 'green',
                redFlagScore: Number(row.red_flag_score ?? 0),
                alertCount: Number(row.alert_count ?? 0),
                doctorId: row.doctor_id as string
            }))
        } catch {
            return []
        }
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

// Update patient folder color and score
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
            folders[folderIndex].redFlagScore = redFlagScore
            folders[folderIndex].alertCount = alertCount
            folders[folderIndex].folderColor = getFolderColorFromScore(redFlagScore)
            folders[folderIndex].lastLogDate = new Date().toISOString()
            
            localStorage.setItem(PATIENT_FOLDERS_KEY, JSON.stringify(folders))
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
            return 'ILD' // Default fallback
    }
}

// Helper function to get folder color from score
function getFolderColorFromScore(score: number): 'green' | 'yellow' | 'red' {
    if (score >= 7) return 'red'
    if (score >= 4) return 'yellow'
    return 'green'
}

// Search patients by name or ID
export function searchPatients(doctorId: string, searchTerm: string): PatientFolder[] {
    const allPatients = getDoctorPatientFolders(doctorId)
    
    if (!searchTerm.trim()) return allPatients
    
    const term = searchTerm.toLowerCase()
    return allPatients.filter(patient => 
        patient.fullName.toLowerCase().includes(term) ||
        patient.patientId.toLowerCase().includes(term)
    )
}

// Get patient count for doctor
export function getDoctorPatientCount(doctorId: string): number {
    return getDoctorPatientFolders(doctorId).length
}

// Get alert counts by type for doctor
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

// Remove doctor-patient mapping (for patient transfer)
export function removeDoctorPatientMapping(doctorId: string, patientId: string): boolean {
    if (typeof window === 'undefined') return false

    try {
        // Remove from mappings
        const mappingStored = localStorage.getItem(MAPPING_STORAGE_KEY)
        const mappings: DoctorPatientMapping[] = mappingStored ? JSON.parse(mappingStored) : []
        
        const filteredMappings = mappings.filter(m => 
            !(m.doctorId === doctorId && m.patientId === patientId)
        )
        
        localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(filteredMappings))
        
        // Remove from patient folders
        const folderStored = localStorage.getItem(PATIENT_FOLDERS_KEY)
        const folders: PatientFolder[] = folderStored ? JSON.parse(folderStored) : []
        
        const filteredFolders = folders.filter(f => 
            !(f.doctorId === doctorId && f.patientId === patientId)
        )
        
        localStorage.setItem(PATIENT_FOLDERS_KEY, JSON.stringify(filteredFolders))
        
        console.log('Doctor-Patient mapping removed:', { doctorId, patientId })
        return true
    } catch (error) {
        console.error('Error removing doctor-patient mapping:', error)
        return false
    }
}