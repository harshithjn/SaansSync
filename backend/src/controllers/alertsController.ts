import { Request, Response } from 'express'
import { z } from 'zod'
import * as alertsService from '../services/alertsService'

const alertSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  patient_name: z.string().optional(),
  level: z.string(),
  reason_text: z.string().min(1, 'Reason is required'),
  triggers: z.array(z.string()).optional(),
  disease_type: z.string()
})

export async function createAlert(req: Request, res: Response) {
  try {
    const validated = alertSchema.parse(req.body)
    const inserted = await alertsService.insertAlert(validated)
    res.json({ success: true, alert: inserted })
  } catch (err: any) {
    console.error('createAlert error', err)
    const message = err?.message || 'Failed to create alert'
    res.status(500).json({ success: false, error: message })
  }
}

export async function getAlerts(req: Request, res: Response) {
  try {
    const doctorId = (req.query.doctorId as string) || (req.body && req.body.doctorId)
    if (!doctorId) return res.status(400).json({ success: false, error: 'doctorId required' })

    const alerts = await alertsService.getAlertsByDoctor(doctorId)
    res.json({ success: true, alerts })
  } catch (err: any) {
    console.error('getAlerts error', err)
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch alerts' })
  }
}

export default {
  createAlert,
  getAlerts
}
