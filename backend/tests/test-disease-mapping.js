// Test disease type mapping
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

async function testDiseaseMapping() {
    console.log('🧪 Testing disease type mapping...\n')
    
    const frontendCategories = [
        "Interstitial Lung Disease (ILD)",
        "Bronchial Asthma",
        "COPD (Chronic Obstructive Pulmonary Disease)",
        "Bronchiectasis",
        "Post ICU Recovery"
    ]
    
    for (const category of frontendCategories) {
        const dbType = mapDiseaseTypeToDatabase(category)
        console.log(`📋 ${category} -> ${dbType}`)
        
        try {
            // Test creating a patient with this disease type
            const testPatient = {
                full_name: `Test Patient ${dbType}`,
                disease_type: dbType,
                patient_data: {
                    email: `test-${dbType.toLowerCase()}@demo.com`,
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
                console.log(`   ❌ Failed: ${createError.message}`)
            } else {
                console.log(`   ✅ Success: Patient created with ID ${patient.id}`)
                // Clean up
                await supabase.from('patient_profiles').delete().eq('id', patient.id)
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`)
        }
    }
    
    console.log('\n🎉 Disease type mapping test complete!')
}

testDiseaseMapping()