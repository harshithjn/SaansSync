import { Request, Response } from 'express'
import * as personalizedAlertsService from '../services/personalizedAlertsService'

export async function createPersonalizedAlert(req: Request, res: Response) {
  try {
    const { patient_id, type, name } = req.body
    if (!patient_id || !type || !name) return res.status(400).json({ success: false, error: 'Missing required fields' })

    const inserted = await personalizedAlertsService.insertPersonalizedAlert(req.body)
    res.json({ success: true, alert: inserted })
  } catch (err: any) {
    console.error('createPersonalizedAlert error', err)
    res.status(500).json({ success: false, error: err?.message || 'Failed to create personalized alert' })
  }
}

export async function listPersonalizedAlerts(req: Request, res: Response) {
  try {
    const patientId = req.query.patientId as string
    if (!patientId) return res.status(400).json({ success: false, error: 'patientId required' })

    const alerts = await personalizedAlertsService.getPersonalizedAlerts(patientId)
    res.json({ success: true, alerts })
  } catch (err: any) {
    console.error('listPersonalizedAlerts error', err)
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch personalized alerts' })
  }
}

export default { createPersonalizedAlert, listPersonalizedAlerts }
