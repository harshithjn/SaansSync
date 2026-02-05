import { requireAdminClient } from '../config/supabaseClient'

export async function createDoctorProfile(userId: string, payload: { fullName: string; email?: string; phone?: string }) {
  const admin = requireAdminClient()
  const { data, error } = await admin
    .from('doctors')
    .insert({
      auth_user_id: userId,
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone || null,
      approval_status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getDoctorProfile(doctorId: string) {
  const admin = requireAdminClient()
  const doctorPK = await resolveDoctorId(doctorId)
  const { data, error } = await admin
    .from('doctors')
    .select('*')
    .eq('id', doctorPK)
    .single()
  if (error) throw error
  return data
}

async function resolveDoctorId(doctorId: string) {
  const admin = requireAdminClient()
  const { data: byId } = await admin.from('doctors').select('id').eq('id', doctorId).maybeSingle()
  if (byId?.id) return byId.id
  const { data: byAuth } = await admin.from('doctors').select('id').eq('auth_user_id', doctorId).maybeSingle()
  return byAuth?.id || doctorId
}

export async function getDoctorPatients(doctorId: string) {
  const admin = requireAdminClient()
  const doctorPK = await resolveDoctorId(doctorId)

  const { data, error } = await admin
    .from('patients')
    .select('id, full_name, email, patient_data, created_at, doctor_id, disease_type')
    .or(`doctor_id.eq.${doctorPK},doctor_id.eq.${doctorId}`)

  if (error) throw error

  const mapped = (data || []).map((p: any) => ({
    ...p,
    disease_type: p.patient_data?.diagnosis?.primaryCategory || p.patient_data?.disease_type || p.disease_type || 'Unknown'
  }))

  return mapped
}

export async function getDoctorLogs(doctorId: string) {
  const admin = requireAdminClient()
  const doctorPK = await resolveDoctorId(doctorId)

  const { data: patients, error: patientsError } = await admin
    .from('patients')
    .select('id, full_name, patient_data')
    .or(`doctor_id.eq.${doctorPK},doctor_id.eq.${doctorId}`)

  if (patientsError) throw patientsError
  if (!patients || patients.length == 0) return []

  const patientIds = patients.map((p: any) => p.id)

  const { data: logs, error: logsError } = await admin
    .from('daily_logs')
    .select('*')
    .in('patient_id', patientIds)
    .order('created_at', { ascending: false })

  if (logsError) throw logsError

  return (logs || []).map((log: any) => {
    const patient = patients.find((p: any) => p.id === log.patient_id)
    return {
      ...log,
      patient_name: patient?.full_name || 'Unknown',
      patient_disease: patient?.patient_data?.diagnosis?.primaryCategory || patient?.patient_data?.disease_type || 'Unknown'
    }
  })
}

export async function getDoctorAlerts(doctorId: string) {
  const admin = requireAdminClient()
  const doctorPK = await resolveDoctorId(doctorId)

  const { data: alerts, error } = await admin
    .from('saanssync_alerts')
    .select('*')
    .or(`doctor_id.eq.${doctorPK},doctor_id.eq.${doctorId}`)
    .order('created_at', { ascending: false })

  if (error) throw error

  const mapped = (alerts || []).map((alert: any) => {
    let type = 'pending-review'
    let score = 1

    if (alert.level === 'RED') {
      type = 'critical'
      score = 10
    } else if (alert.level === 'ORANGE') {
      type = 'high-risk'
      score = 8
    } else if (alert.level === 'YELLOW') {
      type = 'high-risk'
      score = 4
    }

    return {
      ...alert,
      type,
      red_flag_score: score
    }
  })

  return mapped
}

export async function assignPatientToDoctor(doctorId: string, patientId: string, diseaseType?: string) {
  const admin = requireAdminClient()
  const doctorPK = await resolveDoctorId(doctorId)

  await admin
    .from('doctor_patient_mapping')
    .upsert({ doctor_id: doctorPK, patient_id: patientId, disease_type: diseaseType || null })

  await admin
    .from('doctor_patient_assignments')
    .upsert({ doctor_id: doctorPK, patient_id: patientId, status: 'active' })

  return true
}

export async function upsertPatientFolder(payload: {
  patientId: string
  doctorId: string
  fullName: string
  age: number
  diseaseType: string
  lastLogDate: string
  folderColor: string
  redFlagScore: number
  alertCount: number
}) {
  const admin = requireAdminClient()
  const doctorPK = await resolveDoctorId(payload.doctorId)

  const { data, error } = await admin
    .from('patient_folders')
    .upsert({
      patient_id: payload.patientId,
      doctor_id: doctorPK,
      full_name: payload.fullName,
      age: payload.age,
      disease_type: payload.diseaseType,
      last_log_date: payload.lastLogDate,
      folder_color: payload.folderColor,
      red_flag_score: payload.redFlagScore,
      alert_count: payload.alertCount,
      updated_at: new Date().toISOString()
    }, { onConflict: 'patient_id,doctor_id' })
    .select()
    .maybeSingle() // Use maybeSingle to avoid throw on missing data

  if (error) {
    if (error.code === 'PGRST116') return null; // No folder found
    console.error('Upsert folder failed:', error);
    return null; // Don't throw for non-critical feature
  }

  try {
    await assignPatientToDoctor(doctorPK, payload.patientId, payload.diseaseType)
  } catch (e) {
    console.warn('Skipping patient assignment (non-critical):', e);
  }
  return data
}

export async function getPatientFolders(doctorId: string) {
  const admin = requireAdminClient()
  const doctorPK = await resolveDoctorId(doctorId)
  const { data, error } = await admin
    .from('patient_folders')
    .select('*')
    .eq('doctor_id', doctorPK)
  if (error) throw error
  return (data || []).map((row: any) => ({
    patientId: row.patient_id,
    fullName: row.full_name,
    age: Number(row.age || 0),
    diseaseType: row.disease_type,
    lastLogDate: row.last_log_date,
    folderColor: row.folder_color,
    redFlagScore: Number(row.red_flag_score || 0),
    alertCount: Number(row.alert_count || 0),
    doctorId: row.doctor_id
  }))
}

export async function updatePatientFolder(doctorId: string, patientId: string, updates: { redFlagScore?: number; alertCount?: number; folderColor?: string }) {
  const admin = requireAdminClient()
  const doctorPK = await resolveDoctorId(doctorId)
  const { error } = await admin
    .from('patient_folders')
    .update({
      red_flag_score: updates.redFlagScore,
      alert_count: updates.alertCount,
      folder_color: updates.folderColor,
      updated_at: new Date().toISOString()
    })
    .eq('doctor_id', doctorPK)
    .eq('patient_id', patientId)
  if (error) throw error
  return true
}

export async function deletePatientFolder(doctorId: string, patientId: string) {
  const admin = requireAdminClient()
  const doctorPK = await resolveDoctorId(doctorId)
  const { error } = await admin
    .from('patient_folders')
    .delete()
    .eq('doctor_id', doctorPK)
    .eq('patient_id', patientId)
  if (error) throw error
  return true
}
