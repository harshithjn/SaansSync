import { requireAdminClient } from '../config/supabaseClient'

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
  const admin = requireAdminClient()
  let q: any = admin.from('daily_logs').select('*').order('created_at', { ascending: false })
  if (filters.patientId) q = q.eq('patient_id', filters.patientId)
  if (filters.disease) q = q.eq('disease_type', filters.disease)
  if (filters.startDate) q = q.gte('log_date', filters.startDate)
  if (filters.endDate) q = q.lte('log_date', filters.endDate)

  const { data, error } = await q
  if (error) throw error

  const rows = (data || []).map((log: any) => ({
    date: log.log_date,
    patient_id: log.patient_id,
    disease_type: log.disease_type,
    red_flag_score: log.red_flag_score,
    created_at: log.created_at
  }))

  return toCsv(rows)
}
