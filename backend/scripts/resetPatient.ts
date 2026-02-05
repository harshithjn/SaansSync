
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, supabaseServiceKey)

async function reset() {
    console.log('☢️  Initiating Nuclear Patient Reset...')

    const email = 'mohammedbilal96654@gmail.com'
    const password = 'patient123'
    const name = 'Mohammed Bilal'
    const phone = '9370778995'

    // 1. Find and Delete existing Auth User
    const { data: { users } } = await admin.auth.admin.listUsers()
    const existingUser = users.find(u => u.email === email)

    if (existingUser) {
        console.log(`🗑️  Deleting existing Auth User: ${existingUser.id}`)
        const { error } = await admin.auth.admin.deleteUser(existingUser.id)
        if (error) console.error('Error deleting user:', error)
    }

    // 2. Find and Delete existing Patient Profile(s)
    const { data: profiles } = await admin.from('patients').select('id').eq('email', email)
    if (profiles && profiles.length > 0) {
        console.log(`🗑️  Deleting ${profiles.length} existing patient profiles...`)
        for (const p of profiles) {
            await admin.from('patients').delete().eq('id', p.id)
        }
    }

    // 3. Find a Doctor to assign
    const { data: doctors } = await admin.from('doctors').select('id').limit(1)
    const doctorId = doctors && doctors[0] ? doctors[0].id : null
    console.log(`👨‍⚕️  Assigning to Doctor ID: ${doctorId}`)

    // 4. Create New Auth User
    console.log('🆕 Creating fresh Auth User...')
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'patient', full_name: name }
    })

    if (createError || !newUser.user) {
        console.error('❌ Failed to create Auth User:', createError)
        return
    }

    const userId = newUser.user.id
    console.log(`✅ Auth User Created: ${userId}`)

    // 5. Create Patient Profile
    console.log('🆕 Creating fresh Patient Profile...')
    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '')

    const patientData = {
        diagnosis: { primaryCategory: 'Asthma' }, // Default diagnosis
        history: 'Created via reset script'
    }

    const { error: profileError } = await admin.from('patients').insert({
        auth_user_id: userId,
        full_name: name,
        email: email,
        phone: cleanPhone, // Ensure clean format
        disease_type: 'Asthma',
        doctor_id: doctorId,
        patient_data: patientData
        // omitted default_password as column deleted
    })

    if (profileError) {
        console.error('❌ Failed to create Patient Profile:', profileError)
    } else {
        console.log('✅ Patient Profile Created.')
        console.log('-------------------------------------------')
        console.log('🎉 RESET COMPLETE. YOU CAN LOG IN NOW.')
        console.log(`📧 Email: ${email}`)
        console.log(`🔑 Password: ${password}`)
        console.log('-------------------------------------------')
    }
}

reset()
