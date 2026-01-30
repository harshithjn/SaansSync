// Test complete patient creation flow
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hvzzscoreonfosgxhjfe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2enpzY29yZW9uZm9zZ3hoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTE3NjYsImV4cCI6MjA4MjE2Nzc2Nn0.pxmNddDmMNnKHxgllW4gfUJsE3Hp3IHUnuZACGYcHHI'

const supabase = createClient(supabaseUrl, supabaseKey)

// Map frontend disease categories to database disease types
const mapDiseaseTypeToDatabase = (frontendCategory) => {
    const mapping = {
        "Interstitial Lung Disease (ILD)": "ILD",
        "Bronchial Asthma": "Asthma", 
        "COPD (Chronic Obstructive Pulmonary Disease)": "COPD",
        "Bronchiectasis": "Bronchiectasis",
        "Post ICU Recovery": "Post-Infection"
    }
    
    return mapping[frontendCategory] || frontendCategory
}

async function createPatientAccount(email, password, fullName, diseaseType, doctorId) {
    try {
        console.log('Creating patient account:', { email, fullName, diseaseType, doctorId })
        
        // Map frontend disease category to database format
        const dbDiseaseType = mapDiseaseTypeToDatabase(diseaseType)
        console.log('Mapped disease type:', diseaseType, '->', dbDiseaseType)
        
        // Create patient profile
        const { data: profile, error: profileError } = await supabase
            .from('patient_profiles')
            .insert({
                full_name: fullName,
                disease_type: dbDiseaseType,
                doctor_id: doctorId || null,
                patient_data: {
                    email: email,
                    password: password,
                    created_at: new Date().toISOString()
                }
            })
            .select()
            .single()

        if (profileError) {
            console.error('Profile creation error:', profileError)
            return { success: false, error: profileError.message }
        }

        console.log('✅ Patient created in database:', profile)
        return { success: true, profile }

    } catch (error) {
        console.error('Create patient error:', error)
        return { success: false, error: error?.message || 'Unknown error' }
    }
}

async function testPatientCreation() {
    console.log('🧪 Testing complete patient creation flow...\n')
    
    const testCases = [
        {
            email: 'test-asthma@demo.com',
            password: 'patient123',
            fullName: 'Test Asthma Patient',
            diseaseType: 'Bronchial Asthma'
        },
        {
            email: 'test-ild@demo.com', 
            password: 'patient123',
            fullName: 'Test ILD Patient',
            diseaseType: 'Interstitial Lung Disease (ILD)'
        },
        {
            email: 'test-copd@demo.com',
            password: 'patient123', 
            fullName: 'Test COPD Patient',
            diseaseType: 'COPD (Chronic Obstructive Pulmonary Disease)'
        }
    ]
    
    const createdPatients = []
    
    for (const testCase of testCases) {
        console.log(`📋 Testing: ${testCase.diseaseType}`)
        
        const result = await createPatientAccount(
            testCase.email,
            testCase.password,
            testCase.fullName,
            testCase.diseaseType,
            undefined
        )
        
        if (result.success) {
            console.log(`   ✅ Success: Patient created with ID ${result.profile.id}`)
            createdPatients.push(result.profile.id)
        } else {
            console.log(`   ❌ Failed: ${result.error}`)
        }
    }
    
    // Clean up test patients
    console.log('\n🧹 Cleaning up test patients...')
    for (const patientId of createdPatients) {
        await supabase.from('patient_profiles').delete().eq('id', patientId)
        console.log(`   🗑️ Deleted patient ${patientId}`)
    }
    
    console.log('\n🎉 Patient creation test complete!')
    
    if (createdPatients.length === testCases.length) {
        console.log('✅ ALL TESTS PASSED - Patient creation is working!')
    } else {
        console.log('❌ Some tests failed - Check the errors above')
    }
}

testPatientCreation()