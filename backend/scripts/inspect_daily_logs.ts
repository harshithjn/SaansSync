/// <reference types="node" />
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectTable() {
    console.log('Testing insert into daily_logs...')

    // Check if 'data' column exists by trying to insert
    const { data, error } = await supabase
        .from('daily_logs')
        .insert({
            patient_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            log_date: '2025-01-01',
            disease_type: 'Test',
            data: { test: true }, // TRYING 'data'
            red_flag_score: 0
        })
        .select()

    if (error) {
        console.log('Insert with "data" failed:', error.message)

        // Try 'disease_specific_data'
        const { error: err2 } = await supabase
            .from('daily_logs')
            .insert({
                patient_id: '00000000-0000-0000-0000-000000000000',
                log_date: '2025-01-01',
                disease_type: 'Test',
                disease_specific_data: { test: true }, // TRYING 'disease_specific_data'
                red_flag_score: 0
            })
        if (err2) {
            console.log('Insert with "disease_specific_data" failed:', err2.message)

            // Try just 'details' or 'metrics' if needed, or query failure
        } else {
            console.log('SUCCESS with "disease_specific_data"')
        }

    } else {
        console.log('SUCCESS with "data"')
    }
}

inspectTable()
