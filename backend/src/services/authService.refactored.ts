/**
 * UNIFIED AUTHENTICATION SERVICE
 * 
 * Single Source of Truth: Supabase Auth (auth.users)
 * Roles: admin | doctor | patient (stored in user_metadata.role)
 * 
 * Login Methods:
 * - Admin: Email/Password
 * - Doctor: Email/Password
 * - Patient: Mobile OTP ONLY
 */

import { requireAdminClient, requireClient } from '../config/supabaseClient'

// ============================================================================
// HELPERS
// ============================================================================

function normalizePhone(phone: string) {
    const clean = phone.replace(/\D/g, '')
    if (clean.length !== 10) throw new Error('Please enter a valid 10-digit mobile number.')
    if (!/^[6-9]/.test(clean)) throw new Error('Please enter a valid Indian mobile number.')
    return { clean, formatted: `+91${clean}` }
}

// ============================================================================
// ADMIN LOGIN (Email/Password via Supabase Auth)
// ============================================================================

export async function adminLogin(email: string, password: string) {
    const anon = requireClient()

    const { data, error } = await anon.auth.signInWithPassword({ email, password })

    if (error || !data?.user || !data.session) {
        return { success: false, error: error?.message || 'Login failed' }
    }

    // Verify role from user_metadata
    const role = data.user.user_metadata?.role
    if (role !== 'admin') {
        await anon.auth.signOut()
        return { success: false, error: 'Unauthorized: Admin access required' }
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

// ============================================================================
// DOCTOR LOGIN (Email/Password via Supabase Auth)
// ============================================================================

export async function doctorLogin(email: string, password: string) {
    const anon = requireClient()
    const admin = requireAdminClient()

    const { data, error } = await anon.auth.signInWithPassword({ email, password })

    if (error || !data?.user || !data.session) {
        return { success: false, error: error?.message || 'Invalid credentials' }
    }

    // Fetch doctor profile
    const { data: doctorProfile } = await admin
        .from('doctors')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single()

    if (!doctorProfile) {
        await anon.auth.signOut()
        return { success: false, error: 'Doctor profile not found' }
    }

    if (doctorProfile.approval_status !== 'approved') {
        await anon.auth.signOut()
        return {
            success: false,
            error: `Account is ${doctorProfile.approval_status}. Please wait for admin approval.`
        }
    }

    return {
        success: true,
        doctorProfile,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
            id: data.user.id,
            email: data.user.email,
            role: 'doctor'
        }
    }
}

// ============================================================================
// DOCTOR REGISTRATION (Mobile OTP)
// ============================================================================

export async function startDoctorRegistration(phone: string) {
    const admin = requireAdminClient()
    const anon = requireClient()
    const { clean, formatted } = normalizePhone(phone)

    // Check if already registered
    const { data: existing } = await admin
        .from('doctors')
        .select('id')
        .eq('phone', clean)
        .maybeSingle()

    if (existing) {
        return { success: false, error: 'Mobile number already registered. Please login instead.' }
    }

    const { error } = await anon.auth.signInWithOtp({ phone: formatted })
    if (error) return { success: false, error: error.message }

    return { success: true }
}

export async function completeDoctorRegistration(params: {
    phone: string
    token: string
    email: string
    fullName: string
    password: string
    altPhone?: string
}) {
    const admin = requireAdminClient()
    const anon = requireClient()
    const { clean, formatted } = normalizePhone(params.phone)

    // Verify OTP
    const { data: authData, error: authError } = await anon.auth.verifyOtp({
        phone: formatted,
        token: params.token,
        type: 'sms'
    })

    if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Verification failed' }
    }

    // Update auth user with email and password
    const { error: updateError } = await admin.auth.admin.updateUserById(authData.user.id, {
        email: params.email,
        password: params.password,
        email_confirm: true,
        user_metadata: {
            role: 'doctor',
            full_name: params.fullName
        }
    })

    if (updateError) {
        return { success: false, error: 'Failed to set up account: ' + updateError.message }
    }

    // Create doctor profile
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
        .single()

    if (dbError) {
        return { success: false, error: 'Failed to create profile: ' + dbError.message }
    }

    return { success: true, doctorProfile: profile }
}

// ============================================================================
// PATIENT LOGIN (Mobile OTP ONLY)
// ============================================================================

export async function patientLoginWithOtp(phone: string) {
    const anon = requireClient()
    const admin = requireAdminClient()
    const { clean, formatted } = normalizePhone(phone)

    // Verify patient exists
    const { data: patient } = await admin
        .from('patients')
        .select('id, auth_user_id')
        .eq('phone', clean)
        .maybeSingle()

    if (!patient) {
        return {
            success: false,
            error: `Phone number not registered. Please contact your doctor.`
        }
    }

    if (!patient.auth_user_id) {
        return {
            success: false,
            error: 'Account setup incomplete. Please contact your doctor.'
        }
    }

    const { error } = await anon.auth.signInWithOtp({
        phone: formatted,
        options: {
            data: { role: 'patient', patient_id: patient.id }
        }
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export async function verifyPatientOtp(phone: string, token: string) {
    const anon = requireClient()
    const admin = requireAdminClient()
    const { clean, formatted } = normalizePhone(phone)

    const { data: authData, error: authError } = await anon.auth.verifyOtp({
        phone: formatted,
        token: token.trim(),
        type: 'sms'
    })

    if (authError || !authData.user || !authData.session) {
        return { success: false, error: authError?.message || 'OTP verification failed' }
    }

    // Fetch patient profile
    const { data: patientProfile } = await admin
        .from('patients')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single()

    if (!patientProfile) {
        return { success: false, error: 'Patient profile not found. Please contact your doctor.' }
    }

    return {
        success: true,
        patientProfile,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        user: {
            id: authData.user.id,
            email: authData.user.email,
            role: 'patient'
        }
    }
}

// ============================================================================
// GET AUTH PROFILE (Used by /api/auth/me)
// ============================================================================

export async function getAuthProfile(user: { id: string; email?: string | null }) {
    const admin = requireAdminClient()

    // Check doctor
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

    // Check patient
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

    // Check admin (via user_metadata)
    // Note: We could also create an admins table, but for simplicity we use metadata
    // If you want admin profiles in DB, add similar logic here

    return { user, role: null, profile: null }
}
