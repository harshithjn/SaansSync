
import { requireAdminClient } from '../src/config/supabaseClient'

async function seed() {
    const admin = requireAdminClient()
    console.log('🌱 Starting Demo Seeding...')

    // =================================================================
    // 1. CREATE ADMIN USER
    // =================================================================
    const adminEmail = 'admin@saanssync.com'
    const password = 'admin123'

    let adminId = ''

    // Check if admin exists in Auth
    const { data: { users: adminUsers } } = await admin.auth.admin.listUsers()
    const existingAdmin = adminUsers.find(u => u.email === adminEmail)

    if (existingAdmin) {
        console.log('✅ Admin already exists:', adminEmail)
        adminId = existingAdmin.id
    } else {
        const { data: newAdmin, error: adminError } = await admin.auth.admin.createUser({
            email: adminEmail,
            password: password,
            email_confirm: true,
            user_metadata: { role: 'admin', full_name: 'System Admin' }
        })
        if (adminError) {
            console.error('❌ Failed to create admin:', adminError.message)
        } else {
            console.log('✅ Created Admin:', adminEmail)
            adminId = newAdmin.user.id
        }
    }

    // =================================================================
    // 2. CREATE DOCTOR
    // =================================================================
    const docEmail = 'doctor@saanssync.com'
    const docPass = 'doctor123'
    const docName = 'Dr. Sarah Miller'

    let doctorId = '' // DB ID (UUID)
    let docAuthId = '' // Auth ID (UUID)

    // Check if doctor exists in DB
    const { data: existingDocProfile } = await admin
        .from('doctors')
        .select('*')
        .eq('email', docEmail)
        .maybeSingle()

    if (existingDocProfile) {
        console.log('✅ Doctor profile already exists:', docName)
        doctorId = existingDocProfile.id

        // Check if auth user exists
        if (existingDocProfile.auth_user_id) {
            docAuthId = existingDocProfile.auth_user_id
        } else {
            // Create auth user if missing
            const { data: newDocAuth, error: daError } = await admin.auth.admin.createUser({
                email: docEmail,
                password: docPass,
                email_confirm: true,
                user_metadata: { role: 'doctor', full_name: docName }
            })
            if (!daError) {
                docAuthId = newDocAuth.user.id
                await admin.from('doctors').update({
                    auth_user_id: docAuthId,
                    approval_status: 'approved'
                }).eq('id', doctorId)
                console.log('   -> Linked new Auth User to existing Doctor Profile')
            }
        }
    } else {
        // Create Fresh Doctor
        // 1. Create Profile
        const { data: newDocProfile, error: dpError } = await admin
            .from('doctors')
            .insert({
                email: docEmail,
                full_name: docName,
                phone: '9876543210',
                approval_status: 'approved' // Auto-approve
            })
            .select()
            .single()

        if (dpError) throw new Error('Failed to create doctor profile: ' + dpError.message)
        doctorId = newDocProfile.id

        // 2. Create Auth User
        const { data: newDocAuth, error: daError } = await admin.auth.admin.createUser({
            email: docEmail,
            password: docPass,
            email_confirm: true,
            user_metadata: { role: 'doctor', full_name: docName }
        })
        if (daError) throw new Error('Failed to create doctor auth: ' + daError.message)
        docAuthId = newDocAuth.user.id

        // 3. Link
        await admin.from('doctors').update({ auth_user_id: docAuthId }).eq('id', doctorId)
        console.log('✅ Created Doctor:', docEmail)
    }

    // =================================================================
    // 3. CREATE PATIENT
    // =================================================================
    const patEmail = 'patient@saanssync.com'
    const patPass = 'patient123'
    const patName = 'John Doe'
    const patPhone = '9988776655'

    let patientId = ''
    let patAuthId = ''

    // Data
    const patientData = {
        fullName: patName,
        age: "65",
        sex: "Male",
        mobileNumber: patPhone,
        emailId: patEmail,
        diagnosis: {
            primaryCategory: "Bronchial Asthma",
            diagnosisDate: "2023-01-01"
        },
        medications: [
            { drugName: "Salbutamol", dose: "2 puffs", frequency: "SOS", isActive: true, startDate: "2023-01-01" }
        ],
        defaultPassword: patPass
    }

    const { data: existingPat } = await admin
        .from('patients')
        .select('*')
        .eq('email', patEmail)
        .maybeSingle()

    if (existingPat) {
        console.log('✅ Patient already exists:', patName)
        patientId = existingPat.id
        patAuthId = existingPat.auth_user_id
    } else {
        // 1. Create Patient Profile
        const { data: newPat, error: npError } = await admin
            .from('patients')
            .insert({
                full_name: patName,
                email: patEmail,
                phone: patPhone,
                patient_data: patientData,
                doctor_id: doctorId,
                disease_type: 'Asthma',
                default_password: patPass
            })
            .select()
            .single()

        if (npError) throw new Error('Failed to create patient: ' + npError.message)
        patientId = newPat.id

        // 2. Create Auth User
        const { data: newPatAuth, error: paError } = await admin.auth.admin.createUser({
            email: patEmail,
            password: patPass,
            email_confirm: true,
            user_metadata: { role: 'patient', full_name: patName, patient_id: patientId }
        })

        if (paError) throw new Error('Failed to create patient auth: ' + paError.message)
        patAuthId = newPatAuth.user.id

        // 3. Link
        await admin.from('patients').update({ auth_user_id: patAuthId }).eq('id', patientId)
        console.log('✅ Created Patient:', patEmail)
    }

    // =================================================================
    // 4. LINK DOCTOR & PATIENT (Folder)
    // =================================================================
    // Ensure patient_folders entry exists
    await admin.from('patient_folders').upsert({
        patient_id: patientId,
        doctor_id: doctorId,
        full_name: patName,
        age: 65,
        disease_type: 'Asthma',
        last_log_date: new Date().toISOString(),
        folder_color: 'green',
        red_flag_score: 1,
        alert_count: 0
    }, { onConflict: 'doctor_id,patient_id' })
    console.log('✅ Patient folder synced.')

    // =================================================================
    // 5. SEED LOGS (History)
    // =================================================================
    // Cleanup old logs for this patient? No, just add if missing.
    // Actually, for demo, let's just make sure we have 2 days of logs.

    const today = new Date()
    const yest = new Date(today); yest.setDate(yest.getDate() - 1);
    const dayBefore = new Date(today); dayBefore.setDate(dayBefore.getDate() - 2);

    // Check if logs exist
    const { count } = await admin.from('daily_logs').select('*', { count: 'exact', head: true }).eq('patient_id', patientId)

    if (count === 0) {
        console.log('📝 Seeding historical logs...')

        // Day -2: Log (Score 2) - Green
        await admin.from('daily_logs').insert({
            patient_id: patientId,
            log_date: dayBefore.toISOString().split('T')[0],
            disease_type: 'Asthma',
            red_flag_score: 2,
            disease_data: {
                raw_score: 2,
                common: { spo2: { atRest: 96 } } // Dummy
            }
        })

        // Day -1: Log (Score 4) - Yellow
        await admin.from('daily_logs').insert({
            patient_id: patientId,
            log_date: yest.toISOString().split('T')[0],
            disease_type: 'Asthma',
            red_flag_score: 4,
            disease_data: {
                raw_score: 4,
                common: { spo2: { atRest: 94 } },
                drivers: ['Mild Symptoms']
            }
        })
        console.log('✅ Seeded 2 historical logs.')
    } else {
        console.log('⏩ Logs already exist, skipping seed.')
    }

    console.log('\n=================================================')
    console.log('🎉 SEEDING COMPLETE')
    console.log('=================================================')
    console.log('You can now login with:')
    console.log('')
    console.log('👨‍⚕️ DOCTOR:')
    console.log('   Email:    doctor@saanssync.com')
    console.log('   Password: doctor123')
    console.log('')
    console.log('👤 PATIENT:')
    console.log('   Email:    patient@saanssync.com')
    console.log('   Password: patient123')
    console.log('')
    console.log('🛡️ ADMIN:')
    console.log('   Email:    admin@saanssync.com')
    console.log('   Password: admin123')
    console.log('=================================================')
}

seed().catch(err => {
    console.error('Seed failed:', err)
    process.exit(1)
})
