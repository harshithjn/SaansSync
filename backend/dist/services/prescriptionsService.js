"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertPrescription = insertPrescription;
exports.getPrescriptions = getPrescriptions;
const supabaseClient_1 = require("../config/supabaseClient");
async function insertPrescription(payload) {
    const db = (0, supabaseClient_1.requireAdminClient)();
    const notes = payload.notes || JSON.stringify({
        patientName: payload.patient_name,
        doctorName: payload.doctor_name,
        personalizedAlerts: payload.personalized_alerts || []
    });
    const { data, error } = await db.from('prescriptions').insert({
        patient_id: payload.patient_id,
        doctor_id: payload.doctor_id,
        prescription_date: payload.prescription_date || new Date().toISOString().split('T')[0],
        medications: payload.medications || [],
        diagnosis: payload.diagnosis || null,
        instructions: payload.instructions || null,
        notes
    }).select().single();
    if (error)
        throw error;
    return data;
}
async function getPrescriptions(query) {
    const db = supabaseClient_1.supabase;
    if (!db)
        throw new Error('Supabase anon client not configured');
    let q = db.from('prescriptions').select('*').order('prescription_date', { ascending: false });
    if (query.patientId)
        q = q.eq('patient_id', query.patientId);
    if (query.doctorId)
        q = q.eq('doctor_id', query.doctorId);
    if (query.startDate)
        q = q.gte('prescription_date', query.startDate);
    if (query.endDate)
        q = q.lte('prescription_date', query.endDate);
    const { data, error } = await q;
    if (error)
        throw error;
    return data || [];
}
exports.default = { insertPrescription, getPrescriptions };
//# sourceMappingURL=prescriptionsService.js.map