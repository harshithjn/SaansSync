// Test daily log creation
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hvzzscoreonfosgxhjfe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2enpzY29yZW9uZm9zZ3hoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTE3NjYsImV4cCI6MjA4MjE2Nzc2Nn0.pxmNddDmMNnKHxgllW4gfUJsE3Hp3IHUnuZACGYcHHI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDailyLogs() {
    console.log('🧪 Testing daily log creation...\n')
    
    try {
        // First create a test patient
        const testPatient = {
            full_name: 'Test Patient for Logs',
            disease_type: 'Asthma',
            patient_data: {
                email: 'test-logs@demo.com',
                password: 'patient123',
                created_at: new Date().toISOString()
            }
        }
        
        const { data: patient, error: patientError } = await supabase
            .from('patient_profiles')
            .insert(testPatient)
            .select()
            .single()
        
        if (patientError) {
            console.log('❌ Patient creation failed:', patientError.message)
            return
        }
        
        console.log('✅ Test patient created:', patient.id)
        
        // Now try to create a daily log
        const testLog = {
            patient_id: patient.id,
            log_date: new Date().toISOString().split('T')[0],
            spo2_at_rest: 95,
            spo2_on_exertion: 90,
            mmrc_scale: 2,
            disease_type: 'Asthma',
            disease_data: {
                peakFlow: 300,
                inhalerUse: 2
            },
            symptoms: {
                cough: 3,
                breathlessness: 4
            },
            medications: [],
            side_effects: [],
            aqi_data: { value: 50 },
            red_flag_score: 3
        }
        
        console.log('📝 Attempting to create daily log...')
        const { data: log, error: logError } = await supabase
            .from('daily_logs')
            .insert(testLog)
            .select()
            .single()
        
        if (logError) {
            console.log('❌ Daily log creation failed:', logError.message)
            
            if (logError.message.includes('row-level security')) {
                console.log('\n🔧 RLS Issue Detected for daily_logs!')
                console.log('The COMPLETE_DATABASE_FIX.sql needs to be applied to disable RLS on daily_logs table')
                console.log('Go to: https://supabase.com/dashboard/project/hvzzscoreonfosgxhjfe/sql')
                console.log('Execute the complete database fix script')
            }
        } else {
            console.log('✅ Daily log created successfully!')
            console.log('📊 Log ID:', log.id)
            
            // Clean up log
            await supabase.from('daily_logs').delete().eq('id', log.id)
        }
        
        // Clean up patient
        await supabase.from('patient_profiles').delete().eq('id', patient.id)
        console.log('🧹 Test data cleaned up')
        
    } catch (error) {
        console.error('❌ Test failed:', error.message)
    }
}

testDailyLogs()