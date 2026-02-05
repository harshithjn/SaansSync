// Professional Session Management - Backend Auth (BFF)
// No direct Supabase usage on the client
import api from './api'
import { onAuthChange, notifyAuthChange } from './auth-events'

export interface AppUser {
  id: string
  email?: string | null
}

export interface AppSession {
  user: AppUser
}

export interface UserProfile {
  role: 'doctor' | 'patient' | 'admin' | null
  profile: DoctorProfile | PatientProfile | null
  approved?: boolean
}

export interface DoctorProfile {
  id: string
  auth_user_id: string
  email: string
  full_name: string
  phone?: string
  approval_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface PatientProfile {
  id: string
  auth_user_id: string
  phone: string
  full_name?: string
  patient_data: any
  created_at: string
  updated_at: string
}

interface AuthMeResponse {
  user: AppUser | null
  role: 'doctor' | 'patient' | 'admin' | null
  profile: any | null
  approved?: boolean
}

// =====================================================
// CORE SESSION FUNCTIONS - BFF ONLY
// =====================================================

/**
 * Get current session from backend
 */
export async function getCurrentSession(): Promise<AppSession | null> {
  try {
    const data = await api.get<AuthMeResponse>('/auth/me')
    if (!data?.user) return null
    return { user: data.user }
  } catch (error) {
    return null
  }
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await getCurrentSession()
  return session?.user || null
}

/**
 * Resolve user profile from backend (NO caching)
 */
export async function resolveUserProfile(): Promise<UserProfile> {
  try {
    const data = await api.get<AuthMeResponse>('/auth/me')
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

/**
 * Check if current user is an admin (email-based fallback)
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user?.email) return false

    const adminEmails = [
      'harshithj1121@gmail.com',
      'admin@healthplatform.com',
      'admin@saanssync.com'
    ]

    return adminEmails.includes(user.email)
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

/**
 * Sign out user (clears server session cookie)
 */
export async function signOutUser(): Promise<boolean> {
  try {
    await api.post('/auth/signout')
    notifyAuthChange(null)
    return true
  } catch (error) {
    console.error('Sign out error:', error)
    return false
  }
}

// =====================================================
// ROUTE PROTECTION HELPERS
// =====================================================

export async function requireAuth(): Promise<AppSession> {
  const session = await getCurrentSession()
  if (!session) throw new Error('Authentication required')
  return session
}

export async function requireApprovedDoctor(): Promise<DoctorProfile> {
  await requireAuth()
  const userProfile = await resolveUserProfile()
  if (userProfile.role !== 'doctor') throw new Error('Doctor role required')
  if (!userProfile.approved) throw new Error('Doctor approval required')
  return userProfile.profile as DoctorProfile
}

export async function requirePatient(): Promise<PatientProfile> {
  await requireAuth()
  const userProfile = await resolveUserProfile()
  if (userProfile.role !== 'patient') throw new Error('Patient role required')
  return userProfile.profile as PatientProfile
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Authentication required')
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) throw new Error('Admin role required')
  return user
}

// =====================================================
// SESSION STATE LISTENER
// =====================================================

export function onAuthStateChange(callback: (session: AppSession | null) => void) {
  let active = true

  // Initial emit
  getCurrentSession().then((session) => {
    if (active) callback(session)
  })

  const unsubscribe = onAuthChange(async () => {
    if (!active) return
    const session = await getCurrentSession()
    callback(session)
  })

  return {
    data: {
      subscription: {
        unsubscribe: () => {
          active = false
          unsubscribe()
        }
      }
    }
  }
}

// =====================================================
// DOMAIN-SPECIFIC QUERIES (BFF)
// =====================================================

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
