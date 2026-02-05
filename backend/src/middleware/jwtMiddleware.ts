import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabaseClient'

export interface AuthUser {
  id: string
  email?: string
  role?: string
}

export interface AuthedRequest extends Request {
  user?: AuthUser
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = (req.headers.authorization || req.headers.Authorization) as string | undefined
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing Authorization header' })
  }

  const token = header.split(' ')[1]

  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Supabase client not configured' })
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error('Token verification failed:', error?.message)
      return res.status(401).json({ success: false, error: 'Invalid or expired token', details: error?.message })
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    }
    return next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    return res.status(401).json({ success: false, error: 'Authentication failed' })
  }
}

export async function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = (req.headers.authorization || req.headers.Authorization) as string | undefined
  if (!header || !header.startsWith('Bearer ')) return next()

  const token = header.split(' ')[1]

  if (!supabase) return next()

  try {
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) {
      req.user = { id: user.id, email: user.email, role: user.role }
    }
  } catch {
    // ignore
  }
  return next()
}
