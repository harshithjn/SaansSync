// Simple in-memory auth event bus (client-side only)

export type AuthEventPayload = {
  user?: { id: string; email?: string | null } | null
  role?: 'doctor' | 'patient' | 'admin' | null
  approved?: boolean
  profile?: unknown
}

type AuthListener = (payload: AuthEventPayload | null) => void

const listeners = new Set<AuthListener>()

export function notifyAuthChange(payload: AuthEventPayload | null = null) {
  listeners.forEach((listener) => {
    try {
      listener(payload)
    } catch (err) {
      console.error('Auth listener error', err)
    }
  })
}

export function onAuthChange(listener: AuthListener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
