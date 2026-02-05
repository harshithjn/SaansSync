"use strict";
/**
 * REFACTORED PATIENT SERVICE
 *
 * Key Changes:
 * - ALWAYS creates Auth User with phone (for OTP login)
 * - NO email/password for patients
 * - auth_user_id is MANDATORY
 * - Fails fast if auth creation fails
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPatient = createPatient;
const supabaseClient_1 = require("../config/supabaseClient");
function cleanPhone(phone) {
    if (!phone)
        return '';
    const cleaned = phone.replace(/\D/g, '');
    // Return cleaned number (10 digits for India)
    return cleaned.length >= 10 ? cleaned : '';
}
async function resolveDoctorId(doctorId) {
    if (!doctorId)
        return null;
    const admin = (0, supabaseClient_1.requireAdminClient)();
    // Try direct id
    const { data: byId } = await admin
        .from('doctors')
        .select('id')
        .eq('id', doctorId)
        .maybeSingle();
    if (byId?.id)
        return byId.id;
    // Try auth_user_id
    const { data: byAuth } = await admin
        .from('doctors')
        .select('id')
        .eq('auth_user_id', doctorId)
        .maybeSingle();
    return byAuth?.id || doctorId;
}
async function createPatient(payload) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const doctorId = await resolveDoctorId(payload.doctorId || null);
    const phone = cleanPhone(payload.phone);
    if (!phone || phone.length < 10) {
        throw new Error('Valid 10-digit phone number is required');
    }
    const formattedPhone = `+91${phone}`;
    // ============================================================================
    // STEP 1: CREATE SUPABASE AUTH USER (MANDATORY)
    // ============================================================================
    let authUserId = null;
    try {
        const { data: authUser, error: authError } = await admin.auth.admin.createUser({
            phone: formattedPhone,
            phone_confirm: true, // Auto-confirm phone for doctor-created patients
            user_metadata: {
                role: 'patient',
                full_name: payload.fullName
            }
        });
        if (authError) {
            // Check if user already exists
            if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
                // Try to find existing user
                const { data: users } = await admin.auth.admin.listUsers();
                const existing = users.users.find(u => u.phone === formattedPhone);
                if (existing) {
                    authUserId = existing.id;
                    console.log(`Using existing auth user: ${authUserId}`);
                }
                else {
                    throw new Error(`Phone number conflict: ${authError.message}`);
                }
            }
            else {
                throw new Error(`Failed to create auth user: ${authError.message}`);
            }
        }
        else if (authUser?.user) {
            authUserId = authUser.user.id;
            console.log(`Created new auth user: ${authUserId}`);
        }
    }
    catch (e) {
        console.error('Auth user creation failed:', e);
        throw new Error(`Cannot create patient: ${e.message}`);
    }
    if (!authUserId) {
        throw new Error('Failed to create or find auth user. Cannot proceed.');
    }
    // ============================================================================
    // STEP 2: CREATE PATIENT PROFILE (with auth_user_id)
    // ============================================================================
    const patientData = payload.patientData || {};
    const comprehensive = {
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
    };
    const { data: profile, error } = await admin
        .from('patients')
        .insert({
        auth_user_id: authUserId, // MANDATORY LINK
        full_name: payload.fullName,
        disease_type: payload.diseaseType,
        doctor_id: doctorId,
        phone,
        patient_data: { ...comprehensive, ...patientData }
    })
        .select()
        .single();
    if (error) {
        console.error('Patient profile creation failed:', error);
        throw new Error(`Database error: ${error.message}`);
    }
    // ============================================================================
    // STEP 3: CREATE DOCTOR-PATIENT ASSIGNMENT
    // ============================================================================
    if (doctorId) {
        try {
            await admin
                .from('doctor_patient_assignments')
                .insert({
                doctor_id: doctorId,
                patient_id: profile.id,
                status: 'active'
            });
        }
        catch (assignError) {
            console.warn('Doctor assignment failed (non-critical):', assignError);
            // Don't fail the entire operation
        }
    }
    return profile;
}
// Other patient service functions remain unchanged...
// (getPatientById, updatePatient, etc.)
//# sourceMappingURL=patientService.refactored.js.map