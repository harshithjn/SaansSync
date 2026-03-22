import { Request, Response } from 'express'
import prisma from '../config/db'
import { isAdminEmail } from '../services/authService'
import { AuthedRequest } from '../middleware/jwtMiddleware'


function ensureAdmin(req: AuthedRequest, res: Response): boolean {
  if (!isAdminEmail(req.user?.email || null)) {
    res.status(403).json({ success: false, error: 'Admin role required' })
    return false
  }
  return true
}

export async function getAllDoctors(req: AuthedRequest, res: Response) {
  if (!ensureAdmin(req, res)) return
  try {
    const doctors = await prisma.doctor.findMany({ orderBy: { createdAt: 'desc' } })
    return res.json(doctors)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message })
  }
}

export async function approveDoctorAccount(req: AuthedRequest, res: Response) {
  if (!ensureAdmin(req, res)) return
  const doctorId = req.params.doctorId

  try {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } })

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' })
    }

    if (doctor.approvalStatus === 'approved' && doctor.authUserId) {
      return res.status(400).json({ success: false, error: 'Doctor is already approved' })
    }

    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        approvalStatus: 'approved'
      }
    })

    return res.json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message })
  }
}

export async function rejectDoctorAccount(req: AuthedRequest, res: Response) {
  if (!ensureAdmin(req, res)) return
  const doctorId = req.params.doctorId

  try {
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { approvalStatus: 'rejected' }
    })
    return res.json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message })
  }
}

export async function fixApprovedDoctors(_req: AuthedRequest, res: Response) {
  return res.json({ success: true, message: 'Clerk removed, no fixing needed.' })
}

export async function getRecentPatients(req: AuthedRequest, res: Response) {
  if (!ensureAdmin(req, res)) return
  
  try {
    const patients = await prisma.patient.findMany({
      select: { id: true, fullName: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return res.json(patients)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
