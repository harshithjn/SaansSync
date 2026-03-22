import prisma from '../config/db';

function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (val: any) => {
    const s = String(val ?? '')
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','))
  }
  return lines.join('\n')
}

export async function exportDailyLogs(filters: {
  disease?: string
  startDate?: string
  endDate?: string
  patientId?: string
  frequency?: string
}) {
  const where: any = {};
  if (filters.patientId) where.patientId = filters.patientId;
  if (filters.disease) where.diseaseType = filters.disease;
  if (filters.startDate) where.logDate = { gte: new Date(filters.startDate) };
  if (filters.endDate) where.logDate = { ...where.logDate, lte: new Date(filters.endDate) };

  const data = await prisma.dailyLog.findMany({
      where,
      orderBy: { createdAt: 'desc' }
  });

  const rows = data.map((log: any) => ({
    date: log.logDate,
    patient_id: log.patientId,
    disease_type: log.diseaseType,
    red_flag_score: log.redFlagScore,
    created_at: log.createdAt
  }))

  return toCsv(rows)
}
