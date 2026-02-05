import { requireAdminClient } from '../config/supabaseClient'

function cleanPhone(phone?: string) {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

async function resolveDoctorId(doctorId?: string | null) {
  if (!doctorId) return null
  const admin = requireAdminClient()
  // Try direct id
  const { data: byId } = await admin
    .from('doctors')
    .select('id')
    .eq('id', doctorId)
    .maybeSingle()
  if (byId?.id) return byId.id

  const { data: byAuth } = await admin
    .from('doctors')
    .select('id')
    .eq('auth_user_id', doctorId)
    .maybeSingle()
  return byAuth?.id || doctorId
}

export async function createPatient(payload: {
  email: string
  password?: string
  fullName: string
  diseaseType: string
  doctorId?: string
  patientData?: any
}) {
  const admin = requireAdminClient()
  const doctorId = await resolveDoctorId(payload.doctorId || null)

  const phone = cleanPhone(payload.patientData?.mobileNumber || payload.patientData?.phone || '')

  // 1. Create Supabase Auth User
  let authUserId = null
  try {
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: payload.email,
      password: payload.password || 'patient123',
      email_confirm: true,
      phone: phone.length >= 10 ? phone : undefined,
      user_metadata: { role: 'patient', full_name: payload.fullName }
    })

    if (authUser?.user) {
      authUserId = authUser.user.id
    } else if (authError?.message?.includes('already registered')) {
      // If user exists, try to find them
      const { data: users } = await admin.auth.admin.listUsers()
      const existing = users.users.find(u => u.email === payload.email || (phone && u.phone?.includes(phone)))
      if (existing) authUserId = existing.id
    }
  } catch (e) {
    console.error('Failed to create auth user:', e)
    // Continue - maybe we can link later? Or should we fail?
    // Failing is safer so we know why login fails.
  }

  const patientData = payload.patientData || {}
  const comprehensive = {
    // ... keep existing comprehensive ...
    email: payload.email,
    password: payload.password,
    mobile: phone,
    age: patientData?.age || '',
    sex: patientData?.sex || '',
    diagnosis: patientData?.diagnosis || {},
    medications: patientData?.medications || [],
    pftRecords: patientData?.pftRecords || [],
    medicalHistory: patientData?.medicalHistory || '',
    comorbidities: patientData?.comorbidities || [],
    respiratorySupport: {
      ltot: patientData?.ltot || { enabled: false },
      bipap: patientData?.bipap || { enabled: false },
      invasiveVentilation: patientData?.invasiveVentilation || { enabled: false },
      tracheostomy: patientData?.tracheostomy || { enabled: false }
    },
    created_at: new Date().toISOString(),
    disease_type: payload.diseaseType
  }

  const { data: profile, error } = await admin
    .from('patients')
    .insert({
      full_name: payload.fullName,
      disease_type: payload.diseaseType,
      doctor_id: doctorId,
      phone,
      email: payload.email,
      auth_user_id: authUserId, // LINK IT HERE
      patient_data: { ...comprehensive, ...patientData }
      // default_password removed
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase create patient error:', error)
    // Log to file for debugging
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), 'debug_errors.log');
      fs.appendFileSync(logPath, `${new Date().toISOString()} - Patient Create Error: ${JSON.stringify(error)}\n`);
    } catch (e) {
      // ignore log error
    }
    throw error
  }

  // Create doctor-patient assignment if table exists
  // Create doctor-patient assignment if table exists
  if (doctorId) {
    try {
      await admin
        .from('doctor_patient_assignments')
        .insert({ doctor_id: doctorId, patient_id: profile.id, status: 'active' })
    } catch (assignError) {
      console.error('Warning: Failed to assign doctor-patient (Patient created successfully):', assignError)
      // Do not throw, as patient is created
    }
  }

  return profile
}

export async function getPatientById(patientId: string) {
  const admin = requireAdminClient()
  const { data, error } = await admin
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single()
  if (error) throw error
  return mapDbToPatientData(data)
}

export async function updatePatient(patientId: string, updates: { full_name?: string; patient_data?: any }) {
  const admin = requireAdminClient()
  const payload: any = { updated_at: new Date().toISOString() }
  if (updates.full_name !== undefined) payload.full_name = updates.full_name
  if (updates.patient_data !== undefined) payload.patient_data = updates.patient_data

  const { error } = await admin
    .from('patients')
    .update(payload)
    .eq('id', patientId)
  if (error) throw error
  return true
}

function mapDbToLogData(log: any) {
  if (!log) return log;

  const diseaseData = log.disease_data || {};
  const common = diseaseData.common || {};
  const specific = diseaseData.specific || {};

  // Create a flat version of the log for frontend compatibility
  return {
    ...log,
    // Date aliases
    date: log.log_date,

    // Vital signs - flattened from JSONB
    spo2: common.spo2?.atRest || common.spo2_at_rest || log.spo2_at_rest || 0,
    spo2_at_rest: common.spo2?.atRest || common.spo2_at_rest || log.spo2_at_rest || 0,
    spo2_on_exertion: common.spo2?.onExertion || common.spo2_on_exertion || log.spo2_on_exertion || 0,

    // PEFR / Peak Flow
    pefr: specific.peakFlowPercent || specific.pefr || specific.peak_flow || log.pefr || 0,
    peak_flow: specific.peakFlowPercent || specific.pefr || specific.peak_flow || log.pefr || 0,

    // mMRC Scale
    mmrc_scale: common.mMRCScale || common.mmrc_scale || log.mmrc_scale || 0,

    // Common symptoms
    cough: common.symptoms?.find((s: any) => s.name?.toLowerCase() === 'cough')?.score || 0,
    breathlessness: common.symptoms?.find((s: any) => s.name?.toLowerCase() === 'breathlessness')?.score || 0,

    // For charts
    displayDate: log.log_date ? new Date(log.log_date).toLocaleDateString() : ''
  };
}

export async function getPatientLogs(patientId: string) {
  const admin = requireAdminClient()
  const { data, error } = await admin
    .from('daily_logs')
    .select('*')
    .eq('patient_id', patientId)
    .order('log_date', { ascending: false })

  if (error) throw error
  return (data || []).map(mapDbToLogData)
}

export async function getPatientMedications(patientId: string) {
  const admin = requireAdminClient()
  const { data, error } = await admin
    .from('patients')
    .select('patient_data')
    .eq('id', patientId)
    .single()
  if (error) throw error
  return data?.patient_data?.medications || []
}

export async function getPatientReports(patientId: string) {
  const admin = requireAdminClient()
  const { data, error } = await admin
    .from('patients')
    .select('patient_data')
    .eq('id', patientId)
    .single()
  if (error) throw error

  const pftRecords = data?.patient_data?.pftRecords || []
  const otherReports = data?.patient_data?.reports || []

  return { pftRecords, reports: otherReports }
}

export async function canLogToday(patientId: string) {
  const admin = requireAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const { count } = await admin
    .from('daily_logs')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', patientId)
    .eq('log_date', today)
  return (count || 0) < 1
}

export async function getPatientInstructions(patientId: string) {
  const admin = requireAdminClient()
  const { data, error } = await admin
    .from('doctor_instructions')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addPatientInstruction(patientId: string, doctorId: string, instruction: string) {
  const admin = requireAdminClient()
  const { data, error } = await admin
    .from('doctor_instructions')
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      instruction,
      is_active: true
    })
    .select()
    .single()
  if (error) throw error
  return data
}

function mapDbToPatientData(data: any) {
  if (data && data.patient_data) {
    const dbData = data.patient_data
    return {
      fullName: data.full_name,
      mobileNumber: dbData.mobile || dbData.mobileNumber || '',
      emailId: data.email || dbData.email || '',
      age: dbData.age || '',
      sex: dbData.sex || dbData.gender || '',
      diagnosis: dbData.diagnosis || {
        primaryCategory: dbData.disease_type || 'Unknown',
        subtype: dbData.disease_subtype || ''
      },
      medications: dbData.medications || [],
      pftRecords: dbData.pftRecords || [],
      // Ensure reports and other dynamic data are passed if needed
      reports: dbData.reports || [],
      medicalHistory: dbData.medicalHistory || '',
      comorbidities: dbData.comorbidities || [],
      ltot: dbData.respiratorySupport?.ltot || { enabled: false },
      bipap: dbData.respiratorySupport?.bipap || { enabled: false },
      invasiveVentilation: dbData.respiratorySupport?.invasiveVentilation || { enabled: false },
      tracheostomy: dbData.respiratorySupport?.tracheostomy || { enabled: false },
      registrationDate: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
    }
  }
  return data
}
