import { Request, Response } from 'express'
import { AuthedRequest } from '../middleware/jwtMiddleware'
import * as doctorService from '../services/doctorService'

export async function getDoctorPatients(req: Request, res: Response) {
  try {
    const doctorId = req.params.doctorId
    const data = await doctorService.getDoctorPatients(doctorId)
    return res.json(data)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch patients' })
  }
}

export async function getDoctorProfile(req: Request, res: Response) {
  try {
    const doctorId = req.params.doctorId
    const data = await doctorService.getDoctorProfile(doctorId)
    return res.json(data)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch doctor profile' })
  }
}

export async function getDoctorLogs(req: Request, res: Response) {
  try {
    const doctorId = req.params.doctorId
    const data = await doctorService.getDoctorLogs(doctorId)
    return res.json(data)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch logs' })
  }
}

export async function getDoctorAlerts(req: Request, res: Response) {
  try {
    const doctorId = req.params.doctorId
    const data = await doctorService.getDoctorAlerts(doctorId)
    return res.json(data)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch alerts' })
  }
}

export async function assignPatient(req: Request, res: Response) {
  try {
    const doctorId = req.params.doctorId
    const { patientId, diseaseType } = req.body
    if (!patientId) return res.status(400).json({ success: false, error: 'patientId required' })
    await doctorService.assignPatientToDoctor(doctorId, patientId, diseaseType)
    return res.json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to assign patient' })
  }
}

export async function upsertPatientFolder(req: Request, res: Response) {
  try {
    const doctorId = req.params.doctorId
    const { patientId, fullName, age, diseaseType, lastLogDate, folderColor, redFlagScore, alertCount } = req.body
    if (!patientId) return res.status(400).json({ success: false, error: 'patientId required' })
    const data = await doctorService.upsertPatientFolder({
      patientId,
      doctorId,
      fullName,
      age: Number(age || 0),
      diseaseType,
      lastLogDate,
      folderColor,
      redFlagScore: Number(redFlagScore || 0),
      alertCount: Number(alertCount || 0)
    })
    return res.json(data)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to upsert patient folder' })
  }
}

export async function getPatientFolders(req: Request, res: Response) {
  try {
    const doctorId = req.params.doctorId
    const data = await doctorService.getPatientFolders(doctorId)
    return res.json(data)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch patient folders' })
  }
}

export async function updatePatientFolder(req: Request, res: Response) {
  try {
    const doctorId = req.params.doctorId
    const patientId = req.params.patientId
    const { redFlagScore, alertCount, folderColor } = req.body
    await doctorService.updatePatientFolder(doctorId, patientId, { redFlagScore, alertCount, folderColor })
    return res.json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update patient folder' })
  }
}

export async function deletePatientFolder(req: Request, res: Response) {
  try {
    const doctorId = req.params.doctorId
    const patientId = req.params.patientId
    await doctorService.deletePatientFolder(doctorId, patientId)
    return res.json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete patient folder' })
  }
}

export async function createDoctorProfile(req: AuthedRequest, res: Response) {
  try {
    const { fullName, email, phone } = req.body
    if (!fullName) return res.status(400).json({ success: false, error: 'fullName required' })
    if (!req.user?.id) return res.status(401).json({ success: false, error: 'Unauthorized' })

    const data = await doctorService.createDoctorProfile(req.user.id, { fullName, email, phone })
    return res.json({ success: true, profile: data })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create doctor profile' })
  }
}
