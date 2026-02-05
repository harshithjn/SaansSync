import { SupabaseClient } from '@supabase/supabase-js'
import { requireAdminClient, supabase as anonClient } from '../config/supabaseClient'

export interface AlertInsert {
    patient_id: string
    doctor_id: string
    level: string
    reason_text: string
    disease_type: string
    alert_data?: Record<string, any>
}

export async function insertAlert(payload: AlertInsert, useAdmin = true) {
    const db: SupabaseClient = useAdmin ? requireAdminClient() : (anonClient as SupabaseClient)

    const { data, error } = await db.from('saanssync_alerts').insert({
        patient_id: payload.patient_id,
        doctor_id: payload.doctor_id,
        level: payload.level,
        reason_text: payload.reason_text,
        disease_type: payload.disease_type,
        alert_data: payload.alert_data || {},
        acknowledged: false
    }).select().single()

    if (error) throw error
    return data
}

export async function getAlertsByDoctor(doctorId: string) {
    const db = requireAdminClient()
    const { data, error } = await db.from('saanssync_alerts').select('*').eq('doctor_id', doctorId).order('created_at', { ascending: false })
    if (error) throw error
    return data || []
}

export async function getAlertsByPatient(patientId: string) {
    const db = requireAdminClient()
    const { data, error } = await db
        .from('saanssync_alerts')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
}

export default {
    insertAlert,
    getAlertsByDoctor,
    getAlertsByPatient
}
