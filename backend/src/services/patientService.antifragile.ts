import { requireAdminClient } from '../config/supabaseClient'

// ============================================================
// PHONE NORMALIZATION (Reusable)
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
// ANTIFRAGILE PATIENT CREATION
// ============================================================
/**
 * Creates a patient with ATOMIC auth user creation
 * 
 * GOLDEN RULE: A patient can login ONLY if created by a doctor
 * 
 * This function:
 * 1. Creates Supabase Auth user FIRST
 * 2. Links auth_user_id to patients table
 * 3. Patient can login immediately via OTP
 * 
 * NO null auth_user_id
 * NO delayed linking
 * NO OTP hacks
 */
export async function createPatient(payload: {
    fullName: string
    phone: string
    email: string
    diseaseType: string
    doctorId: string
    patientData?: any
}) {
    const admin = requireAdminClient()

    // 1. Normalize phone number
    const { clean: cleanPhone, formatted: formattedPhone } = normalizePhone(payload.phone)

    // 2. Validate required fields
    if (!payload.fullName || !payload.email || !payload.diseaseType || !payload.doctorId) {
        throw new Error('Missing required fields: fullName, email, diseaseType, doctorId')
    }

    // 3. Check if phone already exists
    const { data: existingPatient } = await admin
        .from('patients')
        .select('id, phone')
        .eq('phone', cleanPhone)
        .maybeSingle()

    if (existingPatient) {
        throw new Error(`Phone number ${cleanPhone} is already registered`)
    }

    // 4. Check if email already exists
    const { data: existingEmail } = await admin
        .from('patients')
        .select('id, email')
        .eq('email', payload.email.toLowerCase().trim())
        .maybeSingle()

    if (existingEmail) {
        throw new Error(`Email ${payload.email} is already registered`)
    }

    // 5. Verify doctor exists
    const { data: doctor, error: doctorError } = await admin
        .from('doctors')
        .select('id, full_name')
        .eq('id', payload.doctorId)
        .single()

    if (doctorError || !doctor) {
        throw new Error('Doctor not found')
    }

    // 6. CREATE SUPABASE AUTH USER (Access Grant Point)
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        phone: formattedPhone,
        phone_confirm: true, // Auto-confirm phone (no verification needed)
        user_metadata: {
            role: 'patient',
            full_name: payload.fullName,
            created_by_doctor: payload.doctorId
        }
    })

    if (authError || !authUser?.user) {
        console.error('Failed to create auth user:', authError)
        throw new Error(`Failed to create patient auth: ${authError?.message || 'Unknown error'}`)
    }

    const authUserId = authUser.user.id

    // 7. Prepare comprehensive patient data
    const comprehensiveData = {
        // Basic info
        fullName: payload.fullName,
        mobileNumber: cleanPhone,
        emailId: payload.email,
        age: payload.patientData?.age || '',
        sex: payload.patientData?.sex || '',
        registrationDate: new Date().toISOString().split('T')[0],

        // Medical info
        diagnosis: payload.patientData?.diagnosis || {
            primaryCategory: payload.diseaseType,
            subtype: ''
        },
        medicalHistory: payload.patientData?.medicalHistory || '',
        comorbidities: payload.patientData?.comorbidities || [],
        occupationalExposure: payload.patientData?.occupationalExposure || '',
        smokingStatus: payload.patientData?.smokingStatus || 'Never',
        packYears: payload.patientData?.packYears || '',

        // Medications
        medications: payload.patientData?.medications || [],

        // PFT Records
        pftRecords: payload.patientData?.pftRecords || [],

        // Respiratory Support
        requiresRespiratorySupport: payload.patientData?.requiresRespiratorySupport || 'No',
        ltot: payload.patientData?.ltot || { enabled: false, oxygenLitres: '' },
        bipap: payload.patientData?.bipap || { enabled: false },
        invasiveVentilation: payload.patientData?.invasiveVentilation || { enabled: false },
        tracheostomy: payload.patientData?.tracheostomy || { enabled: false },

        // Additional
        additionalNotes: payload.patientData?.additionalNotes || '',
        created_at: new Date().toISOString(),
        disease_type: payload.diseaseType
    }

    // 8. CREATE PATIENT PROFILE (with auth_user_id link)
    const { data: patientProfile, error: profileError } = await admin
        .from('patients')
        .insert({
            auth_user_id: authUserId, // CRITICAL: Link to auth user
            full_name: payload.fullName,
            phone: cleanPhone,
            email: payload.email.toLowerCase().trim(),
            doctor_id: payload.doctorId,
            disease_type: payload.diseaseType,
            patient_data: comprehensiveData
        })
        .select()
        .single()

    if (profileError) {
        // Rollback: Delete auth user if profile creation fails
        try {
            await admin.auth.admin.deleteUser(authUserId)
        } catch (rollbackError) {
            console.error('Failed to rollback auth user:', rollbackError)
        }

        console.error('Failed to create patient profile:', profileError)
        throw new Error(`Failed to create patient: ${profileError.message}`)
    }

    // 9. Create doctor-patient assignment
    try {
        await admin
            .from('doctor_patient_assignments')
            .insert({
                doctor_id: payload.doctorId,
                patient_id: patientProfile.id,
                status: 'active'
            })
    } catch (assignError) {
        console.warn('Warning: Failed to create doctor-patient assignment (patient created successfully):', assignError)
        // Don't throw - patient is created successfully
    }

    // 10. Create initial patient folder for doctor dashboard
    try {
        await admin
            .from('patient_folders')
            .insert({
                patient_id: patientProfile.id,
                doctor_id: payload.doctorId,
                full_name: payload.fullName,
                age: parseInt(payload.patientData?.age || '0') || 0,
                disease_type: payload.diseaseType,
                folder_color: 'green',
                red_flag_score: 1,
                alert_count: 0,
                last_log_date: null
            })
    } catch (folderError) {
        console.warn('Warning: Failed to create patient folder (patient created successfully):', folderError)
        // Don't throw - patient is created successfully
    }

    return {
        success: true,
        patient: patientProfile,
        message: `Patient ${payload.fullName} created successfully. They can now login with phone ${formattedPhone} using OTP.`
    }
}

// ============================================================
// PATIENT QUERIES
// ============================================================

export async function getPatientById(patientId: string) {
    const admin = requireAdminClient()
    const { data, error } = await admin
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

    if (error) throw error
    return data
}

export async function getPatientByPhone(phone: string) {
    const admin = requireAdminClient()
    const { clean } = normalizePhone(phone)

    const { data, error } = await admin
        .from('patients')
        .select('*')
        .eq('phone', clean)
        .single()

    if (error) throw error
    return data
}

export async function updatePatient(patientId: string, updates: {
    full_name?: string
    patient_data?: any
}) {
    const admin = requireAdminClient()

    const payload: any = {
        updated_at: new Date().toISOString()
    }

    if (updates.full_name !== undefined) {
        payload.full_name = updates.full_name
    }

    if (updates.patient_data !== undefined) {
        payload.patient_data = updates.patient_data
    }

    const { error } = await admin
        .from('patients')
        .update(payload)
        .eq('id', patientId)

    if (error) throw error
    return true
}

export async function getPatientLogs(patientId: string) {
    const admin = requireAdminClient()
    const { data, error } = await admin
        .from('daily_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('log_date', { ascending: false })

    if (error) throw error
    return data || []
}

export async function canLogToday(patientId: string): Promise<boolean> {
    const admin = requireAdminClient()
    const today = new Date().toISOString().split('T')[0]

    const { count } = await admin
        .from('daily_logs')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('log_date', today)

    return (count || 0) < 1
}
