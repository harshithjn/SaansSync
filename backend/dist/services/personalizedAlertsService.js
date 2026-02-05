"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertPersonalizedAlert = insertPersonalizedAlert;
exports.getPersonalizedAlerts = getPersonalizedAlerts;
const supabaseClient_1 = require("../config/supabaseClient");
async function insertPersonalizedAlert(payload) {
    const db = (0, supabaseClient_1.requireClient)();
    const { data, error } = await db.from('personalized_alerts').insert({
        patient_id: payload.patient_id,
        doctor_id: payload.doctor_id || null,
        type: payload.type,
        name: payload.name,
        frequency: payload.frequency || null,
        interval: payload.interval || null,
        instructions: payload.instructions || null,
        is_active: payload.is_active !== false
    }).select().single();
    if (error)
        throw error;
    return data;
}
async function getPersonalizedAlerts(patientId) {
    const db = supabaseClient_1.supabase;
    if (!db)
        throw new Error('Supabase anon client not configured');
    const { data, error } = await db.from('personalized_alerts').select('*').eq('patient_id', patientId).eq('is_active', true);
    if (error)
        throw error;
    return data || [];
}
exports.default = { insertPersonalizedAlert, getPersonalizedAlerts };
//# sourceMappingURL=personalizedAlertsService.js.map