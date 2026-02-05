import { requireAdminClient, requireClient } from '../config/supabaseClient'

// ============================================================
// ADMIN EMAILS (Hardcoded for simplicity)
// ============================================================
const ADMIN_EMAILS = [
    'harshithj1121@gmail.com',
    'admin@healthplatform.com',
    'admin@saanssync.com'
]

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

// ============================================================
// PHONE NORMALIZATION (Indian Mobile Numbers)
// ============================================================
function normalizePhone(phone: string) {
    const clean = phone.replace(/\D/g, '')
    if (clean.length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number.')
    }
    if (!/^[6-9]/.test(clean)) {
        throw new Error('Please enter a valid Indian mobile number starting with 6-9.')
    }
    return {
        clean,
        formatted: `+91${clean}`
    }
}

// ============================================================
// HELPER: Check if email is admin
// ============================================================
export function isAdminEmail(email?: string | null): boolean {
    if (!email) return false
    return ADMIN_EMAILS.includes(email.toLowerCase().trim())
}

// ============================================================
// 1. ADMIN AUTHENTICATION (Email + Password Only)
// ============================================================

export async function adminLogin(email: string, password: string) {
    // Validate admin email
    if (!isAdminEmail(email)) {
        return { success: false, error: 'Invalid admin credentials' }
    }

    // Validate password
    if (password !== ADMIN_PASSWORD) {
        return { success: false, error: 'Invalid admin credentials' }
    }

    const anon = requireClient()

    // Try to sign in
    let { data, error } = await anon.auth.signInWithPassword({ email, password })

    // If user doesn't exist, create admin account
    if (error?.message.includes('Invalid login credentials')) {
        const signUp = await anon.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'admin',
                    full_name: 'System Administrator'
                }
            }
        })

        if (signUp.error) {
            return { success: false, error: signUp.error.message }
        }

        data = { user: signUp.data.user, session: signUp.data.session } as any
        error = null
    }

    if (error || !data.session) {
        return { success: false, error: error?.message || 'Login failed' }
    }

    // Verify role
    if (data.user?.user_metadata?.role !== 'admin') {
        return { success: false, error: 'Unauthorized: Not an admin account' }
    }

    return {
        success: true,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
            id: data.user.id,
            email: data.user.email,
            role: 'admin'
        }
    }
}

// ============================================================
// 2. PATIENT AUTHENTICATION (OTP Only)
// ============================================================

/**
 * Step 1: Send OTP to patient's phone
 * Validates that patient exists before sending OTP
 */
export async function patientLoginWithOtp(phone: string) {
    const admin = requireAdminClient()
    const anon = requireClient()

    // Normalize phone number
    const { clean, formatted } = normalizePhone(phone)

    // Check if patient exists
    const { data: patient, error: dbError } = await admin
        .from('patients')
        .select('id, full_name')
        .eq('phone', clean)
        .maybeSingle()

    if (dbError) {
        return { success: false, error: dbError.message }
    }

    if (!patient) {
        return {
            success: false,
            error: `Phone number ${clean} not registered. Please contact your doctor.`
        }
    }

    // Send OTP via Supabase
    const { error: otpError } = await anon.auth.signInWithOtp({
        phone: formatted,
        options: {
            data: {
                role: 'patient',
                patient_id: patient.id,
                full_name: patient.full_name
            }
        }
    })

    if (otpError) {
        return { success: false, error: otpError.message }
    }

    return {
        success: true,
        message: `OTP sent to ${formatted}`
    }
}

/**
 * Step 2: Verify OTP and login patient
 * Returns JWT token and patient profile
 */
export async function verifyPatientOtp(phone: string, token: string) {
    const admin = requireAdminClient()
    const anon = requireClient()

    // Normalize phone and OTP
    const { clean, formatted } = normalizePhone(phone)
    const cleanToken = token.replace(/\D/g, '').slice(0, 6)

    if (cleanToken.length !== 6) {
        return { success: false, error: 'OTP must be exactly 6 digits' }
    }

    // Verify OTP with Supabase
    const { data: authData, error: authError } = await anon.auth.verifyOtp({
        phone: formatted,
        token: cleanToken,
        type: 'sms'
    })

    if (authError || !authData.user || !authData.session) {
        return {
            success: false,
            error: authError?.message || 'Invalid OTP. Please try again.'
        }
    }

    // Fetch patient profile using auth_user_id
    const { data: patientProfile, error: profileError } = await admin
        .from('patients')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single()

    if (profileError || !patientProfile) {
        return {
            success: false,
            error: 'Patient profile not found. Please contact your doctor.'
        }
    }

    return {
        success: true,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        user: {
            id: authData.user.id,
            phone: authData.user.phone,
            role: 'patient'
        },
        patientProfile
    }
}

// ============================================================
// 3. GET CURRENT USER PROFILE
// ============================================================

export async function getAuthProfile(user: { id: string; email?: string | null; phone?: string | null }) {
    const admin = requireAdminClient()

    // Check if admin
    if (isAdminEmail(user.email)) {
        return {
            user,
            role: 'admin' as const,
            profile: { email: user.email },
            approved: true
        }
    }

    // Check if doctor
    const { data: doctorProfile } = await admin
        .from('doctors')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle()

    if (doctorProfile) {
        return {
            user,
            role: 'doctor' as const,
            profile: doctorProfile,
            approved: doctorProfile.approval_status === 'approved'
        }
    }

    // Check if patient
    const { data: patientProfile } = await admin
        .from('patients')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle()

    if (patientProfile) {
        return {
            user,
            role: 'patient' as const,
            profile: patientProfile,
            approved: true
        }
    }

    // No profile found
    return {
        user,
        role: null,
        profile: null,
        approved: false
    }
}

// ============================================================
// 4. DOCTOR AUTHENTICATION (Kept from existing system)
// ============================================================
// Note: Doctor auth flows remain unchanged as they're already working
// This includes:
// - startDoctorRegistration()
// - completeDoctorRegistration()
// - doctorLoginWithPassword()
// - doctorLoginWithOtp()
// - verifyDoctorOtp()
// - setupDoctorPassword()
// - startPasswordReset()

// Re-export existing doctor functions (from original authService.ts)
export {
    startDoctorRegistration,
    completeDoctorRegistration,
    doctorLoginWithPassword,
    doctorLoginWithOtp,
    verifyDoctorOtp,
    setupDoctorPassword,
    startPasswordReset
} from './authService'
