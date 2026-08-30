import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth as useGlobalAuth } from '@/components/auth/AuthProvider'
import { authApi } from './api'

export interface AuthState {
  user: any | null
  loading: boolean
  role: 'doctor' | 'patient' | 'admin' | null
  approved?: boolean
  profile?: any
}

export function useAuth(): AuthState {
  const { user, loading: globalLoading, token } = useGlobalAuth();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    role: null,
    approved: false,
    profile: null
  })

  useEffect(() => {
    let mounted = true;

    if (globalLoading) return;

    if (!token || !user) {
      if (mounted) setAuthState({ user: null, loading: false, role: null, approved: false, profile: null });
      return;
    }

    authApi.get<any>('/me')
      .then((res) => {
        if (mounted) {
          setAuthState({
            user: { id: user.id, email: user.email },
            loading: false,
            role: res.role,
            approved: res.approved,
            profile: res.profile
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load profile via BFF', err);
        if (mounted) {
          setAuthState({ user: null, loading: false, role: null, approved: false, profile: null });
        }
      });

    return () => { mounted = false; };
  }, [globalLoading, token, user]);

  return authState;
}

export function useDoctorAuth() {
  const router = useRouter()
  const authState = useAuth()

  useEffect(() => {
    if (!authState.loading) {
      if (!authState.user) {
        router.push('/sign-in')
        return
      }

      if (authState.role !== 'doctor') {
        router.push('/sign-in')
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

export function usePatientAuth() {
  const router = useRouter()
  const authState = useAuth()

  useEffect(() => {
    if (!authState.loading) {
      if (!authState.user) {
        router.push('/sign-in')
        return
      }

      if (authState.role !== 'patient') {
        router.push('/sign-in')
        return
      }
    }
  }, [authState, router])

  return authState
}

export function useAdminAuth() {
  const router = useRouter()
  const authState = useAuth()

  useEffect(() => {
    if (!authState.loading) {
      if (!authState.user) {
        router.push('/sign-in')
        return
      }

      if (authState.role !== 'admin') {
        router.push('/sign-in')
      }
    }
  }, [authState, router])

  return authState
}

export async function checkClientAuth() {
  try {
    const data = await authApi.get<any>('/me');
    if (!data?.user) return null;
    return {
      role: data.role,
      profile: data.profile,
      approved: data.approved
    };
  } catch (error) {
    return null;
  }
}