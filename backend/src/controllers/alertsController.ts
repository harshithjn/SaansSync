import { Request, Response } from 'express'
import { z } from 'zod'
import * as alertsService from '../services/alertsService' // DAO
import * as alertEvaluationService from '../services/alertService' // Complex Logic
import prisma from '../config/db'

const alertSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  level: z.string(),
  reason_text: z.string().min(1, 'Reason is required'),
  disease_type: z.string(),
  alert_data: z.record(z.string(), z.any()).optional()
})

const evaluateSchema = z.object({
  diseaseType: z.string(),
  submission: z.any() // Full Log object
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

export async function evaluateAlert(req: Request, res: Response) {
  try {
    const patientId = req.params.patientId;
    const { diseaseType, submission } = evaluateSchema.parse(req.body);

    // Ensure patientId in submission matches params
    submission.patientId = patientId;
    submission.diseaseType = diseaseType;

    const result = await alertEvaluationService.evaluateAndStoreAlert(patientId, diseaseType, submission);
    res.json({ success: true, evaluation: result });

  } catch (err: any) {
    console.error('evaluateAlert error', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to evaluate alert' });
  }
}

export async function getAlerts(req: Request, res: Response) {
  try {
    const doctorId = (req.query.doctorId as string) || (req.body && req.body.doctorId)
    const patientId = (req.query.patientId as string) || (req.body && req.body.patientId)

    if (!doctorId && !patientId) {
      return res.status(400).json({ success: false, error: 'doctorId or patientId required' })
    }

    if (doctorId) {
      const alerts = await alertsService.getAlertsByDoctor(doctorId)
      return res.json({ success: true, alerts })
    }

    const alerts = await alertsService.getAlertsByPatient(patientId as string)
    return res.json({ success: true, alerts })
  } catch (err: any) {
    console.error('getAlerts error', err)
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch alerts' })
  }
}

export async function acknowledgeAlert(req: Request, res: Response) {
  try {
    const alertId = req.params.alertId
    // Using service for consistency or direct DB
    // Simple enough for direct DB or service call? 
    // Let's use service if available, but alertsService doesn't have it explicitly yet?
    // The previous file content had logic inline. Let's keep it but clean import.
    await prisma.alert.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date()
      }
    });

    return res.json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to acknowledge alert' })
  }
}

export default {
  createAlert,
  evaluateAlert,
  getAlerts,
  acknowledgeAlert
}
