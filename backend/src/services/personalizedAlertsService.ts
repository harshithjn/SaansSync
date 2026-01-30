import { requireClient, requireAdminClient, supabase as anonClient } from '../config/supabaseClient'

export async function insertPersonalizedAlert(payload: any) {
  const db = requireClient()
  const { data, error } = await db.from('personalized_alerts').insert({
    patient_id: payload.patient_id,
    doctor_id: payload.doctor_id || null,
    type: payload.type,
    name: payload.name,
    frequency: payload.frequency || null,
    interval: payload.interval || null,
    instructions: payload.instructions || null,
    is_active: payload.is_active !== false
  }).select().single()

  if (error) throw error
  return data
}

export async function getPersonalizedAlerts(patientId: string) {
  const db = anonClient
  if (!db) throw new Error('Supabase anon client not configured')

  const { data, error } = await db.from('personalized_alerts').select('*').eq('patient_id', patientId).eq('is_active', true)
  if (error) throw error
  return data || []
}

export default { insertPersonalizedAlert, getPersonalizedAlerts }
