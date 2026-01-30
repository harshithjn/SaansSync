import { requireAdminClient, supabase as anonClient } from '../config/supabaseClient'

export async function insertPrescription(payload: any) {
  const db = requireAdminClient()
  const { data, error } = await db.from('prescriptions').insert({
    patient_id: payload.patient_id,
    doctor_id: payload.doctor_id,
    patient_name: payload.patient_name,
    doctor_name: payload.doctor_name,
    prescription_date: payload.prescription_date || new Date().toISOString().split('T')[0],
    medications: payload.medications || [],
    personalized_alerts: payload.personalized_alerts || [],
    diagnosis: payload.diagnosis || null,
    instructions: payload.instructions || null
  }).select().single()

  if (error) throw error
  return data
}

export async function getPrescriptions(query: { patientId?: string; doctorId?: string }) {
  const db = anonClient
  if (!db) throw new Error('Supabase anon client not configured')

  let q: any = db.from('prescriptions').select('*').order('prescription_date', { ascending: false })
  if (query.patientId) q = q.eq('patient_id', query.patientId)
  if (query.doctorId) q = q.eq('doctor_id', query.doctorId)

  const { data, error } = await q
  if (error) throw error
  return data || []
}

export default { insertPrescription, getPrescriptions }
