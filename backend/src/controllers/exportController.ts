import { Request, Response } from 'express'
import * as exportService from '../services/exportService'

export async function exportDailyLogs(req: Request, res: Response) {
  try {
    const { disease, startDate, endDate, patientId, frequency } = req.query
    const csv = await exportService.exportDailyLogs({
      disease: disease as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      patientId: patientId as string | undefined,
      frequency: frequency as string | undefined
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="daily_logs.csv"')
    return res.send(csv)
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to export logs' })
  }
}
