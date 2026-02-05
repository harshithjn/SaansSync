"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertAlert = insertAlert;
exports.getAlertsByDoctor = getAlertsByDoctor;
exports.getAlertsByPatient = getAlertsByPatient;
const supabaseClient_1 = require("../config/supabaseClient");
async function insertAlert(payload, useAdmin = true) {
    const db = useAdmin ? (0, supabaseClient_1.requireAdminClient)() : supabaseClient_1.supabase;
    const { data, error } = await db.from('saanssync_alerts').insert({
        patient_id: payload.patient_id,
        doctor_id: payload.doctor_id,
        level: payload.level,
        reason_text: payload.reason_text,
        disease_type: payload.disease_type,
        alert_data: payload.alert_data || {},
        acknowledged: false
    }).select().single();
    if (error)
        throw error;
    return data;
}
async function getAlertsByDoctor(doctorId) {
    const db = supabaseClient_1.supabase;
    if (!db)
        throw new Error('Supabase anon client not configured');
    const { data, error } = await db.from('saanssync_alerts').select('*').eq('doctor_id', doctorId).order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
async function getAlertsByPatient(patientId) {
    const db = supabaseClient_1.supabase;
    if (!db)
        throw new Error('Supabase anon client not configured');
    const { data, error } = await db
        .from('saanssync_alerts')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
exports.default = {
    insertAlert,
    getAlertsByDoctor,
    getAlertsByPatient
};
//# sourceMappingURL=alertsService.js.map