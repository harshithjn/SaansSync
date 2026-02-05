// Production Authentication Service (BFF-backed)
import api from './api'
import { notifyAuthChange } from './auth-events'

export interface DoctorProfile {
  id: string
  auth_user_id?: string
  email: string
  full_name: string
  phone?: string
  alt_phone?: string
  approval_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface PatientProfile {
  id: string
  auth_user_id: string
  phone: string
  alt_phone?: string
  full_name?: string
  patient_data: any
  created_at: string
  updated_at: string
}

// =====================================================
// DOCTOR AUTHENTICATION
// =====================================================

export async function startDoctorRegistration(phone: string) {
  try {
    return await api.post<{ success: boolean; error?: string }>(
      '/auth/doctor/start-registration',
      { phone }
    )
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function completeDoctorRegistration(
  phone: string,
  token: string,
  email: string,
  fullName: string,
  password: string,
  altPhone?: string
) {
  try {
    const result = await api.post<{ success: boolean; error?: string; doctorProfile?: DoctorProfile }>(
      '/auth/doctor/complete-registration',
      { phone, token, email, fullName, password, altPhone }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function signInDoctorWithPassword(email: string, password: string) {
  try {
    const result = await api.post<{ success: boolean; error?: string; doctorProfile?: DoctorProfile }>(
      '/auth/doctor/login',
      { email, password }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function setupDoctorPassword(phone: string, token: string, newPassword: string) {
  try {
    return await api.post<{ success: boolean; error?: string }>(
      '/auth/doctor/setup-password',
      { phone, token, newPassword }
    )
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function initiatePasswordReset(phone: string) {
  try {
    return await api.post<{ success: boolean; error?: string }>(
      '/auth/password/reset/start',
      { phone }
    )
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function completePasswordReset(phone: string, token: string, newPassword: string) {
  return setupDoctorPassword(phone, token, newPassword)
}

// Legacy compatibility: direct doctor signup (admin review)
export async function signUpDoctor(
  email: string,
  fullName: string,
  phone?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    return await api.post('/auth/doctor/signup', { email, fullName, phone })
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function signInDoctorWithOTP(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    return await api.post('/auth/doctor/login-otp', { email })
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function verifyDoctorOTP(email: string, token: string) {
  try {
    const result = await api.post<{ success: boolean; error?: string; doctorProfile?: DoctorProfile }>(
      '/auth/doctor/verify-otp',
      { email, token }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// =====================================================
// PATIENT AUTHENTICATION (Phone OTP Only)
// =====================================================

export async function signInPatientWithOTP(phoneNumber: string) {
  try {
    return await api.post<{ success: boolean; error?: string }>(
      '/auth/patient/login-otp',
      { phone: phoneNumber }
    )
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function signInPatientWithPassword(email: string, password: string) {
  try {
    const result = await api.post<{ success: boolean; error?: string; patientProfile?: PatientProfile }>(
      '/auth/patient/login',
      { email, password }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function verifyPatientOTP(phoneNumber: string, token: string) {
  try {
    const result = await api.post<{ success: boolean; error?: string; patientProfile?: PatientProfile }>(
      '/auth/patient/verify-otp',
      { phone: phoneNumber, token }
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

export async function findPatientByPhone(phoneNumber: string) {
  try {
    return await api.post<{ found: boolean; patient?: any; error?: string }>(
      '/admin/patients/search',
      { phone: phoneNumber }
    )
  } catch (error) {
    return { found: false, error: (error as Error).message }
  }
}

export async function debugPatientPhoneNumbers(): Promise<void> {
  try {
    await api.get('/admin/patients/recent')
  } catch {
    // no-op
  }
}

// =====================================================
// ADMIN FUNCTIONS (Service Role Required - server only)
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


export async function signInAdminWithPassword(email: string, password: string) {
  try {
    const result = await api.post<{ success: boolean; error?: string }>(
      '/auth/admin/login',
      { email, password }
    )
    if (result?.success) notifyAuthChange()
    return result
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
