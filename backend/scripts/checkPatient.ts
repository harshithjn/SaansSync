
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    console.log('Checking patients...')

    // List all patients
    const { data: patients, error } = await admin.from('patients').select('*')

    if (error) {
        console.error('Error fetching patients:', error)
        return
    }

    console.log(`Found ${patients.length} patients in DB:`)
    patients.forEach(p => {
        console.log(`- Name: ${p.full_name}, Phone: ${p.phone}, Email: ${p.email}, AuthID: ${p.auth_user_id}`)
    })
}

check()
