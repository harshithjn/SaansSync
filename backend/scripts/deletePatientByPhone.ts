
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, supabaseServiceKey)

async function deleteByPhone() {
    const phone = '9370778994' // The duplicate number from error
    console.log(`Searching for patient with phone: ${phone}`)

    const { data: patients } = await admin.from('patients').select('id, full_name').eq('phone', phone)

    if (patients && patients.length > 0) {
        console.log(`Found ${patients.length} patients. Deleting...`)
        for (const p of patients) {
            console.log(`Deleting ${p.full_name} (${p.id})`)
            // Delete relationships first if needed, but CASCADE should handle it if set, if not we delete manually
            await admin.from('doctor_patient_assignments').delete().eq('patient_id', p.id)
            const { error } = await admin.from('patients').delete().eq('id', p.id)
            if (error) console.error('Error deleting:', error)
            else console.log('Deleted successfully.')
        }
    } else {
        console.log('No patients found with that phone number.')
    }
}

deleteByPhone()
