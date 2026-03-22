import { Request, Response, NextFunction } from 'express'
import { getAuth } from '@clerk/express'
import prisma from '../config/db'

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/auth')) return next()

  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ success: false, error: 'Missing Authorization' })
    }

    let role = 'UNKNOWN'
    let email = ''

    const doctor = await prisma.doctor.findUnique({ where: { authUserId: auth.userId } })
    if (doctor) {
      role = 'DOCTOR'
      email = doctor.email
    } else {
      const patient = await prisma.patient.findUnique({ where: { authUserId: auth.userId } })
      if (patient) {
        role = 'PATIENT'
        email = patient.email
      }
    }

    ;(req as any).user = { id: auth.userId, email, role }
    return next()
  } catch (err) {
    console.error('Auth middleware error', err)
    return res.status(500).json({ success: false, error: 'Authentication error' })
  }
}

export default authMiddleware
