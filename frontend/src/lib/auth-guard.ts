// Professional Route Guards - Database-Driven Security
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getCurrentSession, 
  resolveUserProfile, 
  isCurrentUserAdmin,
  requireAuth,
  requireApprovedDoctor,
  requirePatient,
  requireAdmin,
  onAuthStateChange,
  type UserProfile
} from './session-manager'

// =====================================================
// SERVER-SIDE ROUTE GUARDS
// =====================================================

/**
 * Guard for doctor dashboard routes
 * Requires: Valid session + Approved doctor
 */
export async function guardDoctorRoute(doctorId?: string) {
  try {
    const doctorProfile = await requireApprovedDoctor()
    
    // If doctorId is provided, verify it matches the authenticated doctor
    if (doctorId && doctorProfile.id !== doctorId) {
      console.log('❌ Doctor ID mismatch')
      redirect('/login')
    }
    
    return doctorProfile
  } catch (error) {
    console.log('❌ Doctor route guard failed:', error)
    
    // Check if user exists but is not approved
    const userProfile = await resolveUserProfile()
    if (userProfile.role === 'doctor' && !userProfile.approved) {
      redirect('/doctor/pending-approval')
    }
    
    redirect('/login')
  }
}

/**
 * Guard for patient dashboard routes
 * Requires: Valid session + Patient role
 */
export async function guardPatientRoute() {
  try {
    const patientProfile = await requirePatient()
    return patientProfile
  } catch (error) {
    console.log('❌ Patient route guard failed:', error)
    redirect('/patient/login')
  }
}

/**
 * Guard for admin routes
 * Requires: Valid session + Admin email
 */
export async function guardAdminRoute() {
  try {
    const user = await requireAdmin()
    return user
  } catch (error) {
    console.log('❌ Admin route guard failed:', error)
    redirect('/admin/login')
  }
}

/**
 * Guard for public routes (redirect if already authenticated)
 */
export async function guardPublicRoute() {
  try {
    const session = await getCurrentSession()
    if (!session) return // Not authenticated, allow access
    
    const userProfile = await resolveUserProfile()
    
    // Redirect based on role and approval status
    if (userProfile.role === 'doctor') {
      if (userProfile.approved) {
        redirect(`/doctor/dashboard/${userProfile.profile?.id}`)
      } else {
        redirect('/doctor/pending-approval')
      }
    } else if (userProfile.role === 'patient') {
      redirect('/patient/dashboard')
    } else {
      // Check if admin
      const isAdmin = await isCurrentUserAdmin()
      if (isAdmin) {
        redirect('/admin/dashboard')
      }
    }
  } catch (error) {
    console.log('❌ Public route guard error:', error)
    // Allow access on error
  }
}

// =====================================================
// CLIENT-SIDE HOOKS (React Components)
// =====================================================

export interface AuthState {
  user: any | null
  loading: boolean
  role: 'doctor' | 'patient' | null
  approved?: boolean
  profile?: any
}

/**
 * Professional auth hook - NO localStorage caching
 * Always fetches fresh data from Supabase
 */
export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    role: null,
    approved: false,
    profile: null
  })

  useEffect(() => {
    let mounted = true

    const updateAuthState = async () => {
      try {
        const session = await getCurrentSession()
        
        if (!session?.user) {
          if (mounted) {
            setAuthState({ user: null, loading: false, role: null })
          }
          return
        }

        // Resolve profile from database (NO caching)
        const userProfile = await resolveUserProfile()
        
        if (mounted) {
          setAuthState({
            user: session.user,
            loading: false,
            role: userProfile.role,
            approved: userProfile.approved,
            profile: userProfile.profile
          })
        }
      } catch (error) {
        console.error('❌ Auth state update error:', error)
        if (mounted) {
          setAuthState({ user: null, loading: false, role: null })
        }
      }
    }

    // Initial load
    updateAuthState()

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (session) => {
      if (session?.user) {
        await updateAuthState()
      } else if (mounted) {
        setAuthState({ user: null, loading: false, role: null })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return authState
}

/**
 * Doctor route protection hook
 */
export function useDoctorAuth() {
  const router = useRouter()
  const authState = useAuth()

  useEffect(() => {
    if (!authState.loading) {
      if (!authState.user) {
        router.push('/login')
        return
      }

      if (authState.role !== 'doctor') {
        router.push('/login')
        return
      }

      if (!authState.approved) {
        router.push('/doctor/pending-approval')
        return
      }
    }
  }, [authState, router])

  return authState
}

/**
 * Patient route protection hook
 */
export function usePatientAuth() {
  const router = useRouter()
  const authState = useAuth()

  useEffect(() => {
    if (!authState.loading) {
      if (!authState.user) {
        router.push('/patient/login')
        return
      }

      if (authState.role !== 'patient') {
        router.push('/patient/login')
        return
      }
    }
  }, [authState, router])

  return authState
}

/**
 * Admin route protection hook
 */
export function useAdminAuth() {
  const router = useRouter()
  const authState = useAuth()

  useEffect(() => {
    if (!authState.loading) {
      if (!authState.user) {
        router.push('/admin/login')
        return
      }

      // Check admin status from database
      isCurrentUserAdmin().then(isAdmin => {
        if (!isAdmin) {
          router.push('/admin/login')
        }
      })
    }
  }, [authState, router])

  return authState
}

// =====================================================
// LEGACY COMPATIBILITY (for existing code)
// =====================================================

/**
 * Client-side authentication check
 * Returns current user profile or null
 */
export async function checkClientAuth() {
  try {
    const session = await getCurrentSession()
    if (!session) return null
    
    const userProfile = await resolveUserProfile()
    return userProfile
  } catch (error) {
    console.error('❌ Client auth check error:', error)
    return null
  }
}

/**
 * Check if user has access to specific doctor dashboard
 */
export async function checkDoctorDashboardAccess(
  requestedDoctorId: string,
  currentUser: any
): Promise<boolean> {
  try {
    const userProfile = await resolveUserProfile()
    
    if (userProfile.role !== 'doctor' || !userProfile.approved) {
      return false
    }
    
    return userProfile.profile?.id === requestedDoctorId
  } catch (error) {
    console.error('❌ Check doctor dashboard access error:', error)
    return false
  }
}

/**
 * Check if user has access to specific patient data
 */
export async function checkPatientDataAccess(
  requestedPatientId: string,
  currentUser: any,
  userRole: 'doctor' | 'patient'
): Promise<boolean> {
  try {
    const userProfile = await resolveUserProfile()
    
    if (userProfile.role === 'patient') {
      // Patients can only access their own data
      return userProfile.profile?.id === requestedPatientId
    }

    if (userProfile.role === 'doctor' && userProfile.approved) {
      // Approved doctors can access patient data (server-side validation via RLS)
      return true
    }

    return false
  } catch (error) {
    console.error('❌ Check patient data access error:', error)
    return false
  }
}