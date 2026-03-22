// Production Authentication Service (BFF-backed)
import api from './api'
import { notifyAuthChange } from './auth-events'

export interface DoctorProfile {
  id: string
  email: string
  full_name: string
  approval_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface PatientProfile {
  id: string
  email: string
  full_name?: string
  patient_data: any
  created_at: string
  updated_at: string
}

// =====================================================
// DOCTOR AUTHENTICATION
// =====================================================

export async function signInDoctorWithPassword(email: string, password?: string) {
  try {
    const result = await api.post<{ success: boolean; error?: string; token?: string; doctorProfile?: DoctorProfile }>(
      '/auth/doctor/login',
      { email, password }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function signUpDoctor(
  email: string,
  fullName: string,
  password?: string
): Promise<{ success: boolean; error?: string; token?: string; doctorProfile?: DoctorProfile }> {
  try {
    const result = await api.post<{ success: boolean; error?: string; token?: string; doctorProfile?: DoctorProfile }>(
      '/auth/doctor/signup',
      { email, fullName, password }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// =====================================================
// PATIENT AUTHENTICATION
// =====================================================

export async function signInPatientWithPassword(email: string, password?: string) {
  try {
    const result = await api.post<{ success: boolean; error?: string; token?: string; patientProfile?: PatientProfile }>(
      '/auth/patient/login',
      { email, password }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function signUpPatient(
  email: string,
  fullName: string,
  password?: string
): Promise<{ success: boolean; error?: string; token?: string; patientProfile?: PatientProfile }> {
  try {
    const result = await api.post<{ success: boolean; error?: string; token?: string; patientProfile?: PatientProfile }>(
      '/auth/patient/signup',
      { email, fullName, password }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// =====================================================
// GENERAL AUTH FUNCTIONS
// =====================================================

export async function getCurrentUser() {
  try {
    const data = await api.get<{ user: any | null }>('/auth/me')
    return data?.user ?? null
  } catch (error) {
    return null
  }
}

export async function signOut() {
  try {
    await api.post('/auth/signout')
    notifyAuthChange(null)
    return true
  } catch (error) {
    return false
  }
}

export async function getCurrentUserProfile() {
  try {
    const data = await api.get<{ role: 'doctor' | 'patient' | 'admin' | null; profile: any | null; approved?: boolean }>(
      '/auth/me'
    )
    return data
  } catch (error) {
    return { role: null, profile: null }
  }
}


// =====================================================
// ADMIN FUNCTIONS
// =====================================================

export async function getAllDoctors(): Promise<DoctorProfile[]> {
  try {
    return await api.get<DoctorProfile[]>('/admin/doctors')
  } catch (error) {
    return []
  }
}

export async function approveDoctorAccount(doctorId: string) {
  try {
    return await api.post<{ success: boolean; error?: string }>(`/admin/doctors/${doctorId}/approve`)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function rejectDoctorAccount(doctorId: string) {
  try {
    return await api.post<{ success: boolean; error?: string }>(`/admin/doctors/${doctorId}/reject`)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function fixApprovedDoctors() {
  try {
    return await api.post<{ success: boolean; fixed: number; error?: string }>(`/admin/doctors/fix-approved`)
  } catch (error) {
    return { success: false, fixed: 0, error: (error as Error).message }
  }
}


export async function signInAdminWithPassword(email: string, password?: string) {
  try {
    const result = await api.post<{ success: boolean; error?: string; token?: string }>(
      '/auth/admin/login',
      { email, password }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
