import { Request, Response } from 'express'
import * as prescriptionsService from '../services/prescriptionsService'

export async function createPrescription(req: Request, res: Response) {
  try {
    const { patient_id, doctor_id, patient_name, doctor_name } = req.body
    if (!patient_id || !doctor_id || !patient_name || !doctor_name) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    const inserted = await prescriptionsService.insertPrescription(req.body)
    res.json({ success: true, prescription: inserted })
  } catch (err: any) {
    console.error('createPrescription error', err)
    res.status(500).json({ success: false, error: err?.message || 'Failed to create prescription' })
  }
}

export async function listPrescriptions(req: Request, res: Response) {
  try {
    const patientId = req.query.patientId as string
    const doctorId = req.query.doctorId as string
    if (!patientId && !doctorId) return res.status(400).json({ success: false, error: 'patientId or doctorId required' })

    const prescriptions = await prescriptionsService.getPrescriptions({ patientId, doctorId })
    res.json({ success: true, prescriptions })
  } catch (err: any) {
    console.error('listPrescriptions error', err)
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch prescriptions' })
  }
}

export default { createPrescription, listPrescriptions }
