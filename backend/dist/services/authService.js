"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminEmail = isAdminEmail;
exports.startDoctorRegistration = startDoctorRegistration;
exports.completeDoctorRegistration = completeDoctorRegistration;
exports.doctorLoginWithPassword = doctorLoginWithPassword;
exports.doctorLoginWithOtp = doctorLoginWithOtp;
exports.verifyDoctorOtp = verifyDoctorOtp;
exports.setupDoctorPassword = setupDoctorPassword;
exports.startPasswordReset = startPasswordReset;
exports.patientLoginWithOtp = patientLoginWithOtp;
exports.verifyPatientOtp = verifyPatientOtp;
exports.patientLoginWithPassword = patientLoginWithPassword;
exports.adminLogin = adminLogin;
exports.doctorSignup = doctorSignup;
exports.testEmail = testEmail;
exports.exchangeCodeForSession = exchangeCodeForSession;
exports.getAuthProfile = getAuthProfile;
const supabaseClient_1 = require("../config/supabaseClient");
const ADMIN_EMAILS = [
    'harshithj1121@gmail.com',
    'admin@healthplatform.com',
    'admin@saanssync.com'
];
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
function normalizePhone(phone) {
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 10)
        throw new Error('Please enter a valid 10-digit mobile number.');
    if (!/^[6-9]/.test(clean))
        throw new Error('Please enter a valid Indian mobile number.');
    return { clean, formatted: `+91${clean}` };
}
function isAdminEmail(email) {
    if (!email)
        return false;
    return ADMIN_EMAILS.includes(email);
}
async function startDoctorRegistration(phone) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const anon = (0, supabaseClient_1.requireClient)();
    const { clean, formatted } = normalizePhone(phone);
    const { data: existing } = await admin
        .from('doctors')
        .select('id')
        .eq('phone', clean)
        .maybeSingle();
    if (existing) {
        return { success: false, error: 'Mobile number already registered. Please login instead.' };
    }
    const { error } = await anon.auth.signInWithOtp({ phone: formatted });
    if (error)
        return { success: false, error: error.message };
    return { success: true };
}
async function completeDoctorRegistration(params) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const anon = (0, supabaseClient_1.requireClient)();
    const { clean, formatted } = normalizePhone(params.phone);
    const { data: authData, error: authError } = await anon.auth.verifyOtp({
        phone: formatted,
        token: params.token,
        type: 'sms'
    });
    if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Verification failed' };
    }
    const { data: profile, error: dbError } = await admin
        .from('doctors')
        .insert({
        auth_user_id: authData.user.id,
        email: params.email.trim(),
        full_name: params.fullName.trim(),
        phone: clean,
        alt_phone: params.altPhone?.replace(/\D/g, '') || null,
        approval_status: 'pending'
    })
        .select()
        .single();
    if (dbError) {
        return { success: false, error: 'Failed to create profile: ' + dbError.message };
    }
    return { success: true, doctorProfile: profile };
}
async function doctorLoginWithPassword(email, password) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const anon = (0, supabaseClient_1.requireClient)();
    let { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error && (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed'))) {
        try {
            const { data: profile } = await admin
                .from('doctors')
                .select('phone')
                .eq('email', email)
                .single();
            if (profile?.phone) {
                const formattedPhone = `+91${String(profile.phone).replace(/\D/g, '')}`;
                const fallback = await anon.auth.signInWithPassword({ phone: formattedPhone, password });
                if (!fallback.error) {
                    data = fallback.data;
                    error = null;
                }
            }
        }
        catch {
            // ignore fallback errors
        }
    }
    if (error || !data?.user || !data.session) {
        return { success: false, error: error?.message || 'Login failed' };
    }
    const { data: doctorProfile } = await admin
        .from('doctors')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();
    if (!doctorProfile) {
        return { success: false, error: 'Doctor profile not found' };
    }
    if (doctorProfile.approval_status !== 'approved') {
        return {
            success: false,
            error: `Account is ${doctorProfile.approval_status}. Please wait for admin approval.`
        };
    }
    return {
        success: true,
        doctorProfile,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: { id: data.user.id, email: data.user.email }
    };
}
async function doctorLoginWithOtp(email) {
    const anon = (0, supabaseClient_1.requireClient)();
    const { error } = await anon.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false }
    });
    if (error)
        return { success: false, error: error.message };
    return { success: true };
}
async function verifyDoctorOtp(email, token) {
    const anon = (0, supabaseClient_1.requireClient)();
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const cleanToken = token.replace(/\D/g, '').slice(0, 6);
    if (cleanToken.length !== 6) {
        return { success: false, error: 'OTP must be exactly 6 digits' };
    }
    const { data: authData, error: authError } = await anon.auth.verifyOtp({
        email: email.trim(),
        token: cleanToken,
        type: 'email'
    });
    if (authError || !authData.user || !authData.session) {
        return { success: false, error: authError?.message || 'OTP verification failed' };
    }
    let { data: doctorProfile } = await admin
        .from('doctors')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();
    if (!doctorProfile) {
        const { data: fallbackProfile } = await admin
            .from('doctors')
            .select('*')
            .eq('email', email.trim())
            .eq('approval_status', 'approved')
            .single();
        if (!fallbackProfile) {
            return { success: false, error: 'Doctor profile not found or not approved. Please contact support.' };
        }
        if (!fallbackProfile.auth_user_id) {
            await admin
                .from('doctors')
                .update({ auth_user_id: authData.user.id })
                .eq('id', fallbackProfile.id);
            fallbackProfile.auth_user_id = authData.user.id;
        }
        doctorProfile = fallbackProfile;
    }
    if (doctorProfile.approval_status !== 'approved') {
        return {
            success: false,
            error: doctorProfile.approval_status === 'pending'
                ? 'Account pending approval. Please wait for admin approval.'
                : 'Account rejected. Please contact support.',
            doctorProfile
        };
    }
    return {
        success: true,
        doctorProfile,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        user: { id: authData.user.id, email: authData.user.email }
    };
}
async function setupDoctorPassword(phone, token, newPassword) {
    const anon = (0, supabaseClient_1.requireClient)();
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { formatted } = normalizePhone(phone);
    const { data: authData, error: authError } = await anon.auth.verifyOtp({
        phone: formatted,
        token,
        type: 'sms'
    });
    if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Password setup failed' };
    }
    const { error: updateError } = await admin.auth.admin.updateUserById(authData.user.id, {
        password: newPassword
    });
    if (updateError) {
        return { success: false, error: updateError.message };
    }
    return { success: true };
}
async function startPasswordReset(phone) {
    const anon = (0, supabaseClient_1.requireClient)();
    const { formatted } = normalizePhone(phone);
    const { error } = await anon.auth.signInWithOtp({ phone: formatted });
    if (error)
        return { success: false, error: error.message };
    return { success: true };
}
async function patientLoginWithOtp(phone) {
    const anon = (0, supabaseClient_1.requireClient)();
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { clean, formatted } = normalizePhone(phone);
    const { data: patient } = await admin
        .from('patients')
        .select('id')
        .eq('phone', clean)
        .maybeSingle();
    if (!patient) {
        return { success: false, error: `Phone number not registered. Please contact your doctor to verify your phone number is correctly saved as: ${clean}` };
    }
    const { error } = await anon.auth.signInWithOtp({
        phone: formatted,
        options: {
            data: { role: 'patient', patient_id: patient.id }
        }
    });
    if (error)
        return { success: false, error: error.message };
    return { success: true };
}
async function verifyPatientOtp(phone, token) {
    const anon = (0, supabaseClient_1.requireClient)();
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { clean, formatted } = normalizePhone(phone);
    const { data: authData, error: authError } = await anon.auth.verifyOtp({
        phone: formatted,
        token: token.trim(),
        type: 'sms'
    });
    if (authError || !authData.user || !authData.session) {
        return { success: false, error: authError?.message || 'OTP verification failed' };
    }
    let { data: patientProfile } = await admin
        .from('patients')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();
    if (!patientProfile) {
        const { data: updated } = await admin
            .from('patients')
            .update({ auth_user_id: authData.user.id })
            .eq('phone', clean)
            .select()
            .single();
        patientProfile = updated;
    }
    if (!patientProfile) {
        return { success: false, error: 'Patient profile not found. Please contact your doctor.' };
    }
    return {
        success: true,
        patientProfile,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        user: { id: authData.user.id, email: authData.user.email }
    };
}
async function patientLoginWithPassword(email, password) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { data: row, error } = await admin
        .from('patients')
        .select('id, email, full_name, patient_data, default_password')
        .eq('email', String(email).toLowerCase().trim())
        .maybeSingle();
    if (error)
        return { success: false, error: error.message };
    if (!row)
        return { success: false, error: 'Invalid email or password' };
    const stored = row.default_password ?? row.patient_data?.defaultPassword;
    if (stored !== password)
        return { success: false, error: 'Invalid email or password' };
    const session = { userId: row.id, email: row.email, role: 'patient' };
    return { success: true, session };
}
async function adminLogin(email, password) {
    if (!isAdminEmail(email)) {
        return { success: false, error: 'Invalid admin email' };
    }
    if (password !== ADMIN_PASSWORD) {
        return { success: false, error: 'Invalid admin password' };
    }
    const anon = (0, supabaseClient_1.requireClient)();
    const signIn = await anon.auth.signInWithPassword({ email, password });
    if (signIn.data?.session) {
        return {
            success: true,
            access_token: signIn.data.session.access_token,
            refresh_token: signIn.data.session.refresh_token,
            user: { id: signIn.data.user?.id, email: signIn.data.user?.email }
        };
    }
    const signUp = await anon.auth.signUp({
        email,
        password,
        options: { data: { role: 'admin', full_name: 'System Administrator' } }
    });
    if (signUp.error) {
        return { success: false, error: signUp.error.message };
    }
    if (signUp.data.session) {
        return {
            success: true,
            access_token: signUp.data.session.access_token,
            refresh_token: signUp.data.session.refresh_token,
            user: { id: signUp.data.user?.id, email: signUp.data.user?.email }
        };
    }
    return { success: false, error: 'Admin account created. Please verify email and try again.' };
}
async function doctorSignup(email, fullName, phone) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { data, error } = await admin
        .from('doctors')
        .insert({
        email: email.trim(),
        full_name: fullName.trim(),
        phone: phone?.trim() || null,
        approval_status: 'pending'
    })
        .select()
        .single();
    if (error) {
        return { success: false, error: error.message };
    }
    return {
        success: true,
        message: 'Registration successful! Your application has been submitted for admin review.'
    };
}
async function testEmail(email) {
    const anon = (0, supabaseClient_1.requireClient)();
    const { error } = await anon.auth.signUp({
        email,
        password: 'test123456',
        options: { data: { full_name: 'Test User', role: 'doctor' } }
    });
    if (error)
        return { success: false, error: error.message };
    return { success: true };
}
async function exchangeCodeForSession(code) {
    const anon = (0, supabaseClient_1.requireClient)();
    const { data, error } = await anon.auth.exchangeCodeForSession(code);
    if (error || !data.session) {
        return { success: false, error: error?.message || 'Verification failed' };
    }
    return {
        success: true,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: { id: data.user?.id, email: data.user?.email }
    };
}
async function getAuthProfile(user) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { data: doctorProfile } = await admin
        .from('doctors')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();
    if (doctorProfile) {
        return {
            user,
            role: 'doctor',
            profile: doctorProfile,
            approved: doctorProfile.approval_status === 'approved'
        };
    }
    const { data: patientProfile } = await admin
        .from('patients')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();
    if (patientProfile) {
        return {
            user,
            role: 'patient',
            profile: patientProfile,
            approved: true
        };
    }
    if (isAdminEmail(user.email || null)) {
        return {
            user,
            role: 'admin',
            profile: { email: user.email },
            approved: true
        };
    }
    return { user, role: null, profile: null };
}
//# sourceMappingURL=authService.js.map