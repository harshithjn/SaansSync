import api, { authApi } from './api'

export interface AppUser {
  id: string
  email?: string | null
}

export interface AppSession {
  user: AppUser
}

export interface DoctorProfile {
  id: string
  authUserId: string
  email: string
  fullName: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface PatientProfile {
  id: string
  authUserId: string
  fullName?: string
  patientData: any
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  role: 'doctor' | 'patient' | 'admin' | null
  profile: DoctorProfile | PatientProfile | null
  approved?: boolean
}

export async function getCurrentSession(): Promise<AppSession | null> {
  try {
    const data = await authApi.get<any>('/me')
    if (!data?.user) return null
    return { user: data.user }
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await getCurrentSession()
  return session?.user || null
}

export async function resolveUserProfile(): Promise<UserProfile> {
  try {
    const data = await authApi.get<any>('/me')
    if (!data?.user) return { role: null, profile: null }
    return {
      role: data.role,
      profile: data.profile,
      approved: data.approved
    }
  } catch (error) {
    console.error('Profile resolution error:', error)
    return { role: null, profile: null }
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const userProfile = await resolveUserProfile()
    return userProfile.role === 'admin'
  } catch (error) {
    return false
  }
}

export async function requireAuth(): Promise<AppSession> {
  const session = await getCurrentSession()
  if (!session) throw new Error('Authentication required')
  return session
}

export async function requireApprovedDoctor(): Promise<DoctorProfile> {
  const userProfile = await resolveUserProfile()
  if (userProfile.role !== 'doctor') throw new Error('Doctor role required')
  if (!userProfile.approved) throw new Error('Doctor approval required')
  return userProfile.profile as DoctorProfile
}

export async function requirePatient(): Promise<PatientProfile> {
  const userProfile = await resolveUserProfile()
  if (userProfile.role !== 'patient') throw new Error('Patient role required')
  return userProfile.profile as PatientProfile
}

export async function requireAdmin(): Promise<AppUser> {
  const userProfile = await resolveUserProfile()
  if (userProfile.role !== 'admin') throw new Error('Admin role required')
  return { id: userProfile.profile?.id || 'admin' }
}

export async function getDoctorPatients(doctorId: string) {
  try {
    const data = await api.get<any[]>(`/doctor/${doctorId}/patients`)
    return data || []
  } catch (error) {
    console.error('Get doctor patients error:', error)
    return []
  }
}

export async function assignPatientToDoctor(doctorId: string, patientId: string) {
  try {
    const data = await api.post<{ success: boolean }>(`/doctor/${doctorId}/assign-patient`, { patientId })
    return data?.success === true
  } catch (error) {
    console.error('Assign patient error:', error)
    return false
  }
}
