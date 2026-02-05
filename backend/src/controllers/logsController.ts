import { Request, Response } from 'express'
import * as logsService from '../services/logsService'

export async function createLog(req: Request, res: Response) {
  try {
    const { patientId, diseaseType, commonData, diseaseSpecificData } = req.body
    if (!patientId || !diseaseType) {
      return res.status(400).json({ success: false, error: 'patientId and diseaseType required' })
    }

    const result = await logsService.createDailyLog({
      patientId,
      diseaseType,
      commonData,
      diseaseSpecificData
    })

    return res.json({ success: true, logEntry: result.logEntry, alert: result.alert, score: result.score })
  } catch (err: any) {
    console.error('CRITICAL LOG ERROR:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create log' })
  }
}
