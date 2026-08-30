import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/db'

const JWT_SECRET = process.env.JWT_SECRET || 'saanssync_local_secret'

export interface AuthUser {
  id: string
  email?: string
  role?: string
}

export interface AuthedRequest extends Request {
  user?: AuthUser
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    console.log('--- Auth Debug ---')
    console.log('Path:', req.path)
    console.log('Authorization Header:', authHeader)

    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authorization token missing' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' })
    }

    let role = decoded.role || 'UNKNOWN'
    let email = decoded.email || ''

    // Map DB roles if needed
    const doctor = await prisma.doctor.findUnique({ where: { id: decoded.id } })
    if (doctor) {
      role = 'DOCTOR'
      email = doctor.email
    } else {
      const patient = await prisma.patient.findUnique({ where: { id: decoded.id } })
      if (patient) {
        role = 'PATIENT'
        email = patient.email
      }
    }

    req.user = { id: decoded.id, email, role }
    return next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    return res.status(401).json({ success: false, error: 'Authentication failed' })
  }
}

export async function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      if (decoded && decoded.id) {
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role }
      }
    }
  } catch {

  }
  return next()
}
