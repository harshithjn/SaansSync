// Professional Session Management - Supabase Only
// NO localStorage, NO client-side role caching
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface UserProfile {
  role: 'doctor' | 'patient' | null
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

// =====================================================
// CORE SESSION FUNCTIONS - SUPABASE ONLY
// =====================================================

/**
 * Get current Supabase session (single source of truth)
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Session error:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('❌ Get session error:', error)
    return null
  }
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession()
  return session?.user || null
}

/**
 * Resolve user profile from database (NO caching)
 * This is the ONLY way to determine user role and approval status
 */
export async function resolveUserProfile(): Promise<UserProfile> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { role: null, profile: null }
    }

    console.log('🔍 Resolving profile for user:', user.id)

    // Check if user is a doctor
    const { data: doctorProfile, error: doctorError } = await supabase
      .from('doctors')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (!doctorError && doctorProfile) {
      console.log('👨‍⚕️ Doctor profile found:', doctorProfile.approval_status)
      return {
        role: 'doctor',
        profile: doctorProfile,
        approved: doctorProfile.approval_status === 'approved'
      }
    }

    // Check if user is a patient
    const { data: patientProfile, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (!patientError && patientProfile) {
      console.log('🧑‍🦱 Patient profile found')
      return {
        role: 'patient',
        profile: patientProfile,
        approved: true // Patients don't need approval
      }
    }

    console.log('❓ No profile found for user')
    return { role: null, profile: null }

  } catch (error) {
    console.error('❌ Profile resolution error:', error)
    return { role: null, profile: null }
  }
}

/**
 * Check if current user is an admin (email-based)
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
    console.error('❌ Admin check error:', error)
    return false
  }
}

/**
 * Sign out user (clears Supabase session)
 */
export async function signOutUser(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Sign out error:', error)
      return false
    }
    
    console.log('✅ User signed out successfully')
    return true
  } catch (error) {
    console.error('❌ Sign out error:', error)
    return false
  }
}

// =====================================================
// ROUTE PROTECTION HELPERS
// =====================================================

/**
 * Require authenticated session
 */
export async function requireAuth(): Promise<Session> {
  const session = await getCurrentSession()
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session
}

/**
 * Require approved doctor
 */
export async function requireApprovedDoctor(): Promise<DoctorProfile> {
  await requireAuth()
  
  const userProfile = await resolveUserProfile()
  
  if (userProfile.role !== 'doctor') {
    throw new Error('Doctor role required')
  }
  
  if (!userProfile.approved) {
    throw new Error('Doctor approval required')
  }
  
  return userProfile.profile as DoctorProfile
}

/**
 * Require patient
 */
export async function requirePatient(): Promise<PatientProfile> {
  await requireAuth()
  
  const userProfile = await resolveUserProfile()
  
  if (userProfile.role !== 'patient') {
    throw new Error('Patient role required')
  }
  
  return userProfile.profile as PatientProfile
}

/**
 * Require admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  const isAdmin = await isCurrentUserAdmin()
  
  if (!isAdmin) {
    throw new Error('Admin role required')
  }
  
  return user
}

// =====================================================
// SESSION STATE LISTENER
// =====================================================

/**
 * Listen to auth state changes (for React components)
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Auth state changed:', event, session?.user?.id)
    callback(session)
  })
}

// =====================================================
// DOMAIN-SPECIFIC QUERIES
// =====================================================

/**
 * Get doctor's assigned patients (server-side validated)
 */
export async function getDoctorPatients(doctorId: string) {
  try {
    const { data, error } = await supabase.rpc('get_doctor_patients', {
      doctor_uuid: doctorId
    })

    if (error) {
      console.error('❌ Get doctor patients error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('❌ Get doctor patients error:', error)
    return []
  }
}

/**
 * Assign patient to doctor (server-side validated)
 */
export async function assignPatientToDoctor(doctorId: string, patientId: string) {
  try {
    const { data, error } = await supabase.rpc('assign_patient_to_doctor', {
      doctor_uuid: doctorId,
      patient_uuid: patientId
    })

    if (error) {
      console.error('❌ Assign patient error:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('❌ Assign patient error:', error)
    return false
  }
}