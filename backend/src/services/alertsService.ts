import { SupabaseClient } from '@supabase/supabase-js'
import { requireAdminClient, supabase as anonClient } from '../config/supabaseClient'

export interface AlertInsert {
  patient_id: string
  doctor_id: string
  patient_name?: string | null
  level: string
  reason_text: string
  triggers?: string[]
  disease_type: string
}

export async function insertAlert(payload: AlertInsert, useAdmin = true) {
  const db: SupabaseClient = useAdmin ? requireAdminClient() : (anonClient as SupabaseClient)

  const { data, error } = await db.from('saanssync_alerts').insert({
    patient_id: payload.patient_id,
    doctor_id: payload.doctor_id,
    patient_name: payload.patient_name || null,
    level: payload.level,
    reason_text: payload.reason_text,
    triggers: payload.triggers || [],
    disease_type: payload.disease_type,
    acknowledged: false
  }).select().single()

  if (error) throw error
  return data
}

export async function getAlertsByDoctor(doctorId: string) {
  const db = anonClient
  if (!db) throw new Error('Supabase anon client not configured')

  const { data, error } = await db.from('saanssync_alerts').select('*').eq('doctor_id', doctorId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export default {
  insertAlert,
  getAlertsByDoctor
}
