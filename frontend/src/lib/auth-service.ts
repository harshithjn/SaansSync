import api, { authApi } from './api'
import { notifyAuthChange } from './auth-events'

export interface DoctorProfile {
  id: string
  email: string
  fullName: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface PatientProfile {
  id: string
  email: string
  fullName?: string
  patientData: any
  createdAt: string
  updatedAt: string
}

export async function signInDoctorWithPassword(email: string, password?: string) {
  try {
    const result = await authApi.post<{ success: boolean; error?: string; token?: string; doctorProfile?: DoctorProfile }>(
      '/doctor/login',
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
    const result = await authApi.post<{ success: boolean; error?: string; token?: string; doctorProfile?: DoctorProfile }>(
      '/doctor/signup',
      { email, fullName, password }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function signInPatientWithPassword(email: string, password?: string) {
  try {
    const result = await authApi.post<{ success: boolean; error?: string; token?: string; patientProfile?: PatientProfile }>(
      '/patient/login',
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
    const result = await authApi.post<{ success: boolean; error?: string; token?: string; patientProfile?: PatientProfile }>(
      '/patient/signup',
      { email, fullName, password }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function signInAsGuest(role: 'doctor' | 'patient') {
  try {
    const result = await authApi.post<{ success: boolean; error?: string; token?: string; doctorProfile?: DoctorProfile; patientProfile?: PatientProfile }>(
      '/guest',
      { role }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function getCurrentUser() {
  try {
    const data = await authApi.get<{ user: any | null }>('/me')
    return data?.user ?? null
  } catch (error) {
    return null
  }
}

export async function signOut() {
  try {
    await authApi.post('/signout')
    notifyAuthChange(null)
    return true
  } catch (error) {
    return false
  }
}

export async function getCurrentUserProfile() {
  try {
    const data = await authApi.get<{ role: 'doctor' | 'patient' | 'admin' | null; profile: any | null; approved?: boolean }>(
      '/me'
    )
    return data
  } catch (error) {
    return { role: null, profile: null }
  }
}

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
    const result = await authApi.post<{ success: boolean; error?: string; token?: string }>(
      '/admin/login',
      { email, password }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
