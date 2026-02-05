import { Request, Response } from 'express'
import * as patientService from '../services/patientService'

export async function createPatient(req: Request, res: Response) {
  try {
    const { email, password, fullName, diseaseType, doctorId, patientData } = req.body
    if (!email || !fullName || !diseaseType) {
      return res.status(400).json({ success: false, error: 'email, fullName, diseaseType required' })
    }
    const profile = await patientService.createPatient({ email, password, fullName, diseaseType, doctorId, patientData })
    return res.json({ success: true, profile })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create patient' })
  }
}

export async function getPatient(req: Request, res: Response) {
  try {
    const patientId = req.params.patientId
    const data = await patientService.getPatientById(patientId)
    return res.json(data)
  } catch (err: any) {
    return res.status(404).json({ error: err?.message || 'Patient not found' })
  }
}

export async function updatePatient(req: Request, res: Response) {
  try {
    const patientId = req.params.patientId
    const { full_name, patient_data } = req.body
    await patientService.updatePatient(patientId, { full_name, patient_data })
    return res.json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update patient' })
  }
}

export async function getPatientLogs(req: Request, res: Response) {
  try {
    const patientId = req.params.patientId
    const data = await patientService.getPatientLogs(patientId)
    return res.json(data)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch logs' })
  }
}

export async function getPatientMedications(req: Request, res: Response) {
  try {
    const patientId = req.params.patientId
    const data = await patientService.getPatientMedications(patientId)
    return res.json(data)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch medications' })
  }
}

export async function canLogToday(req: Request, res: Response) {
  try {
    const patientId = req.params.patientId
    const canLog = await patientService.canLogToday(patientId)
    return res.json({ canLog })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to check logging' })
  }
}

export async function getPatientReports(req: Request, res: Response) {
  try {
    const patientId = req.params.patientId
    const data = await patientService.getPatientReports(patientId)
    return res.json(data)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch reports' })
  }
}

export async function getPatientInstructions(req: Request, res: Response) {
  try {
    const patientId = req.params.patientId
    const data = await patientService.getPatientInstructions(patientId)
    return res.json(data)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch instructions' })
  }
}

export async function addPatientInstruction(req: Request, res: Response) {
  try {
    const patientId = req.params.patientId
    const { doctorId, instruction } = req.body
    if (!doctorId || !instruction) {
      return res.status(400).json({ success: false, error: 'doctorId and instruction required' })
    }
    const data = await patientService.addPatientInstruction(patientId, doctorId, instruction)
    return res.json({ success: true, instruction: data })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to add instruction' })
  }
}
