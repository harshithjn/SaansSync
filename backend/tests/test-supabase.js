// Test Supabase connection from frontend folder
const { createClient } = require('@supabase/supabase-js')

// Hardcode the values for testing
const supabaseUrl = 'https://hvzzscoreonfosgxhjfe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2enpzY29yZW9uZm9zZ3hoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTE3NjYsImV4cCI6MjA4MjE2Nzc2Nn0.pxmNddDmMNnKHxgllW4gfUJsE3Hp3IHUnuZACGYcHHI'

console.log('🔍 Testing Supabase connection from frontend...\n')

console.log('Environment variables:')
console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('- SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')

if (!supabaseUrl || !supabaseKey) {
    console.log('\n❌ Environment variables not found!')
    console.log('Make sure .env.local exists in the frontend folder with:')
    console.log('SUPABASE_URL=https://hvzzscoreonfosgxhjfe.supabase.co')
    console.log('SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    try {
        console.log('\n🧪 Testing patient creation...')
        
        const testPatient = {
            full_name: 'Test Patient Frontend',
            disease_type: 'Asthma',
            patient_data: {
                email: 'test-frontend@demo.com',
                password: 'patient123',
                created_at: new Date().toISOString()
            }
        }
        
        const { data: patient, error: createError } = await supabase
            .from('patient_profiles')
            .insert(testPatient)
            .select()
            .single()
        
        if (createError) {
            console.log('❌ Patient creation failed:', createError.message)
            
            if (createError.message.includes('row-level security')) {
                console.log('\n🔧 RLS Issue Detected!')
                console.log('You need to apply the database fix:')
                console.log('1. Go to: https://supabase.com/dashboard/project/hvzzscoreonfosgxhjfe/sql')
                console.log('2. Copy and paste the entire COMPLETE_DATABASE_FIX.sql file')
                console.log('3. Execute it to disable RLS')
            }
            
            return false
        }
        
        console.log('✅ Patient created successfully!')
        console.log('📊 Patient ID:', patient.id)
        
        // Clean up
        await supabase.from('patient_profiles').delete().eq('id', patient.id)
        console.log('🧹 Test data cleaned up')
        
        console.log('\n🎉 Supabase connection is working!')
        return true
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message)
        return false
    }
}

testConnection()