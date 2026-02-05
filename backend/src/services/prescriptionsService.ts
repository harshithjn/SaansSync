import { requireAdminClient, supabase as anonClient } from '../config/supabaseClient'

export async function insertPrescription(payload: any) {
  const db = requireAdminClient()
  const notes = payload.notes || JSON.stringify({
    patientName: payload.patient_name,
    doctorName: payload.doctor_name,
    personalizedAlerts: payload.personalized_alerts || []
  })

  const { data, error } = await db.from('prescriptions').insert({
    patient_id: payload.patient_id,
    doctor_id: payload.doctor_id,
    prescription_date: payload.prescription_date || new Date().toISOString().split('T')[0],
    medications: payload.medications || [],
    diagnosis: payload.diagnosis || null,
    instructions: payload.instructions || null,
    notes
  }).select().single()

  if (error) throw error

  // Trigger alert for patient dashboard
  try {
    // Get disease type from patient record if not easily extractable
    const { data: patient } = await db.from('patients').select('disease_type, full_name').eq('id', payload.patient_id).single()

    await db.from('saanssync_alerts').insert({
      patient_id: payload.patient_id,
      doctor_id: payload.doctor_id,
      level: 'GREEN',
      score: 1,
      reason_text: `New Prescription & Instructions received from Dr. ${payload.doctor_name || 'your doctor'}.`,
      disease_type: patient?.disease_type || 'General',
      alert_data: { prescription_id: data.id }
    })
  } catch (alertErr) {
    console.error('Failed to trigger patient alert for prescription:', alertErr)
    // Don't fail the whole request if alert fails
  }

  return data
}

export async function getPrescriptions(query: { patientId?: string; doctorId?: string; startDate?: string; endDate?: string }) {
  const db = anonClient
  if (!db) throw new Error('Supabase anon client not configured')

  let q: any = db.from('prescriptions').select('*').order('prescription_date', { ascending: false })
  if (query.patientId) q = q.eq('patient_id', query.patientId)
  if (query.doctorId) q = q.eq('doctor_id', query.doctorId)
  if (query.startDate) q = q.gte('prescription_date', query.startDate)
  if (query.endDate) q = q.lte('prescription_date', query.endDate)

  const { data, error } = await q
  if (error) throw error
  return data || []
}

export default { insertPrescription, getPrescriptions }
