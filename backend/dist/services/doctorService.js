"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDoctorProfile = createDoctorProfile;
exports.getDoctorPatients = getDoctorPatients;
exports.getDoctorLogs = getDoctorLogs;
exports.getDoctorAlerts = getDoctorAlerts;
exports.assignPatientToDoctor = assignPatientToDoctor;
exports.upsertPatientFolder = upsertPatientFolder;
exports.getPatientFolders = getPatientFolders;
exports.updatePatientFolder = updatePatientFolder;
exports.deletePatientFolder = deletePatientFolder;
const supabaseClient_1 = require("../config/supabaseClient");
async function createDoctorProfile(userId, payload) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
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
        .single();
    if (error)
        throw error;
    return data;
}
async function resolveDoctorId(doctorId) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { data: byId } = await admin.from('doctors').select('id').eq('id', doctorId).maybeSingle();
    if (byId?.id)
        return byId.id;
    const { data: byAuth } = await admin.from('doctors').select('id').eq('auth_user_id', doctorId).maybeSingle();
    return byAuth?.id || doctorId;
}
async function getDoctorPatients(doctorId) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const doctorPK = await resolveDoctorId(doctorId);
    const { data, error } = await admin
        .from('patients')
        .select('id, full_name, email, patient_data, created_at, doctor_id, disease_type')
        .or(`doctor_id.eq.${doctorPK},doctor_id.eq.${doctorId}`);
    if (error)
        throw error;
    const mapped = (data || []).map((p) => ({
        ...p,
        disease_type: p.patient_data?.diagnosis?.primaryCategory || p.patient_data?.disease_type || p.disease_type || 'Unknown'
    }));
    return mapped;
}
async function getDoctorLogs(doctorId) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const doctorPK = await resolveDoctorId(doctorId);
    const { data: patients, error: patientsError } = await admin
        .from('patients')
        .select('id, full_name, patient_data')
        .or(`doctor_id.eq.${doctorPK},doctor_id.eq.${doctorId}`);
    if (patientsError)
        throw patientsError;
    if (!patients || patients.length == 0)
        return [];
    const patientIds = patients.map((p) => p.id);
    const { data: logs, error: logsError } = await admin
        .from('daily_logs')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false });
    if (logsError)
        throw logsError;
    return (logs || []).map((log) => {
        const patient = patients.find((p) => p.id === log.patient_id);
        return {
            ...log,
            patient_name: patient?.full_name || 'Unknown',
            patient_disease: patient?.patient_data?.diagnosis?.primaryCategory || patient?.patient_data?.disease_type || 'Unknown'
        };
    });
}
async function getDoctorAlerts(doctorId) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const doctorPK = await resolveDoctorId(doctorId);
    const { data: alerts, error } = await admin
        .from('saanssync_alerts')
        .select('*')
        .or(`doctor_id.eq.${doctorPK},doctor_id.eq.${doctorId}`)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    const mapped = (alerts || []).map((alert) => ({
        ...alert,
        type: alert.level === 'RED' ? 'critical' : alert.level === 'YELLOW' ? 'high-risk' : 'pending-review',
        red_flag_score: alert.level === 'RED' ? 10 : alert.level === 'YELLOW' ? 5 : 1
    }));
    return mapped;
}
async function assignPatientToDoctor(doctorId, patientId, diseaseType) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const doctorPK = await resolveDoctorId(doctorId);
    await admin
        .from('doctor_patient_mapping')
        .upsert({ doctor_id: doctorPK, patient_id: patientId, disease_type: diseaseType || null });
    await admin
        .from('doctor_patient_assignments')
        .upsert({ doctor_id: doctorPK, patient_id: patientId, status: 'active' });
    return true;
}
async function upsertPatientFolder(payload) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const doctorPK = await resolveDoctorId(payload.doctorId);
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
        .single();
    if (error)
        throw error;
    await assignPatientToDoctor(doctorPK, payload.patientId, payload.diseaseType);
    return data;
}
async function getPatientFolders(doctorId) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const doctorPK = await resolveDoctorId(doctorId);
    const { data, error } = await admin
        .from('patient_folders')
        .select('*')
        .eq('doctor_id', doctorPK);
    if (error)
        throw error;
    return (data || []).map((row) => ({
        patientId: row.patient_id,
        fullName: row.full_name,
        age: Number(row.age || 0),
        diseaseType: row.disease_type,
        lastLogDate: row.last_log_date,
        folderColor: row.folder_color,
        redFlagScore: Number(row.red_flag_score || 0),
        alertCount: Number(row.alert_count || 0),
        doctorId: row.doctor_id
    }));
}
async function updatePatientFolder(doctorId, patientId, updates) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const doctorPK = await resolveDoctorId(doctorId);
    const { error } = await admin
        .from('patient_folders')
        .update({
        red_flag_score: updates.redFlagScore,
        alert_count: updates.alertCount,
        folder_color: updates.folderColor,
        updated_at: new Date().toISOString()
    })
        .eq('doctor_id', doctorPK)
        .eq('patient_id', patientId);
    if (error)
        throw error;
    return true;
}
async function deletePatientFolder(doctorId, patientId) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const doctorPK = await resolveDoctorId(doctorId);
    const { error } = await admin
        .from('patient_folders')
        .delete()
        .eq('doctor_id', doctorPK)
        .eq('patient_id', patientId);
    if (error)
        throw error;
    return true;
}
//# sourceMappingURL=doctorService.js.map