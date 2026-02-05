"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDoctors = getAllDoctors;
exports.approveDoctorAccount = approveDoctorAccount;
exports.rejectDoctorAccount = rejectDoctorAccount;
exports.fixApprovedDoctors = fixApprovedDoctors;
exports.findPatientByPhone = findPatientByPhone;
exports.getRecentPatients = getRecentPatients;
const supabaseClient_1 = require("../config/supabaseClient");
const authService_1 = require("../services/authService");
function ensureAdmin(req, res) {
    if (!(0, authService_1.isAdminEmail)(req.user?.email || null)) {
        res.status(403).json({ success: false, error: 'Admin role required' });
        return false;
    }
    return true;
}
async function getAllDoctors(req, res) {
    if (!ensureAdmin(req, res))
        return;
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { data, error } = await admin.from('doctors').select('*').order('created_at', { ascending: false });
    if (error)
        return res.status(500).json({ success: false, error: error.message });
    return res.json(data || []);
}
async function approveDoctorAccount(req, res) {
    if (!ensureAdmin(req, res))
        return;
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const doctorId = req.params.doctorId;
    const { data: doctorData, error: doctorError } = await admin
        .from('doctors')
        .select('email, full_name, phone, approval_status, auth_user_id')
        .eq('id', doctorId)
        .single();
    if (doctorError || !doctorData) {
        return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    if (doctorData.approval_status === 'approved' && doctorData.auth_user_id) {
        return res.status(400).json({ success: false, error: 'Doctor is already approved' });
    }
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: doctorData.email,
        password: Math.random().toString(36).substring(2, 15),
        email_confirm: true,
        user_metadata: {
            full_name: doctorData.full_name,
            phone: doctorData.phone || '',
            role: 'doctor'
        }
    });
    if (authError) {
        return res.status(500).json({ success: false, error: `Failed to create login account: ${authError.message}` });
    }
    const { error: updateError } = await admin
        .from('doctors')
        .update({
        auth_user_id: authData.user?.id,
        approval_status: 'approved',
        updated_at: new Date().toISOString()
    })
        .eq('id', doctorId);
    if (updateError) {
        if (authData.user?.id) {
            await admin.auth.admin.deleteUser(authData.user.id);
        }
        return res.status(500).json({ success: false, error: 'Failed to update doctor record' });
    }
    return res.json({ success: true });
}
async function rejectDoctorAccount(req, res) {
    if (!ensureAdmin(req, res))
        return;
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const doctorId = req.params.doctorId;
    const { error } = await admin
        .from('doctors')
        .update({ approval_status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', doctorId);
    if (error)
        return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true });
}
async function fixApprovedDoctors(req, res) {
    if (!ensureAdmin(req, res))
        return;
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { data: doctors, error } = await admin
        .from('doctors')
        .select('id,email,full_name,phone,auth_user_id,approval_status')
        .eq('approval_status', 'approved')
        .is('auth_user_id', null);
    if (error)
        return res.status(500).json({ success: false, error: error.message });
    let fixed = 0;
    for (const d of doctors || []) {
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email: d.email,
            password: Math.random().toString(36).substring(2, 15),
            email_confirm: true,
            user_metadata: { full_name: d.full_name, phone: d.phone || '', role: 'doctor' }
        });
        if (authError)
            continue;
        const { error: updateError } = await admin
            .from('doctors')
            .update({ auth_user_id: authData.user?.id })
            .eq('id', d.id);
        if (!updateError)
            fixed += 1;
    }
    return res.json({ success: true, fixed });
}
async function findPatientByPhone(req, res) {
    if (!ensureAdmin(req, res))
        return;
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { phone } = req.body;
    if (!phone)
        return res.status(400).json({ found: false, error: 'phone required' });
    const clean = String(phone).replace(/\D/g, '');
    const { data: patient, error } = await admin
        .from('patients')
        .select('id, phone, full_name, email, created_at')
        .eq('phone', clean)
        .maybeSingle();
    if (error)
        return res.status(500).json({ found: false, error: error.message });
    if (!patient)
        return res.json({ found: false });
    return res.json({ found: true, patient });
}
async function getRecentPatients(req, res) {
    if (!ensureAdmin(req, res))
        return;
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { data, error } = await admin
        .from('patients')
        .select('id, phone, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
    if (error)
        return res.status(500).json({ success: false, error: error.message });
    return res.json(data || []);
}
//# sourceMappingURL=adminController.js.map