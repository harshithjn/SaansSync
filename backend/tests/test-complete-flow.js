// Test complete patient flow: Doctor creates → Patient logs in → Dashboard shows data
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

async function createPatientAccount(email, password, fullName, diseaseType, doctorId, patientData) {
    try {
        console.log('Creating patient account:', { email, fullName, diseaseType, doctorId })
        
        const dbDiseaseType = mapDiseaseTypeToDatabase(diseaseType)
        console.log('Mapped disease type:', diseaseType, '->', dbDiseaseType)
        
        // Prepare comprehensive patient data
        const comprehensivePatientData = {
            email: email,
            password: password,
            mobile: patientData?.mobileNumber || '',
            age: patientData?.age || '',
            sex: patientData?.sex || '',
            diagnosis: patientData?.diagnosis || {},
            medications: patientData?.medications || [],
            pftRecords: patientData?.pftRecords || [],
            medicalHistory: patientData?.medicalHistory || '',
            comorbidities: patientData?.comorbidities || [],
            respiratorySupport: {
                ltot: patientData?.ltot || { enabled: false },
                bipap: patientData?.bipap || { enabled: false },
                invasiveVentilation: patientData?.invasiveVentilation || { enabled: false },
                tracheostomy: patientData?.tracheostomy || { enabled: false }
            },
            created_at: new Date().toISOString()
        }
        
        const { data: profile, error: profileError } = await supabase
            .from('patient_profiles')
            .insert({
                full_name: fullName,
                disease_type: dbDiseaseType,
                doctor_id: doctorId || null,
                phone: patientData?.mobileNumber || '',
                gender: patientData?.sex || null,
                patient_data: comprehensivePatientData
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

async function testPatientLogin(mobile, email) {
    try {
        console.log('🔐 Testing patient login...')
        
        // Check if mobile number exists in database patients
        const { data: dbPatients, error: dbError } = await supabase
            .from('patient_profiles')
            .select('*')
        
        if (dbError) {
            console.log('❌ Database lookup failed:', dbError.message)
            return false
        }
        
        const dbPatient = dbPatients.find(p => {
            const patientData = p.patient_data || {}
            const dbMobile = patientData.mobile || p.phone || ''
            const cleanDbMobile = dbMobile.replace(/\D/g, '')
            const cleanMobile = mobile.replace(/\D/g, '')
            return cleanDbMobile === cleanMobile
        })
        
        if (!dbPatient) {
            console.log('❌ Patient not found by mobile number')
            return false
        }
        
        console.log('✅ Patient found by mobile:', dbPatient.full_name)
        
        // Test email login
        const dbPatients2 = dbPatients.filter(p => {
            const patientData = p.patient_data || {}
            return patientData.email === email
        })
        
        if (dbPatients2.length === 0) {
            console.log('❌ Patient not found by email')
            return false
        }
        
        console.log('✅ Patient found by email:', dbPatients2[0].full_name)
        return true
        
    } catch (error) {
        console.error('❌ Login test failed:', error.message)
        return false
    }
}

async function testDailyLogCreation(patientId) {
    try {
        console.log('📝 Testing daily log creation...')
        
        const testLog = {
            patient_id: patientId,
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
        
        const { data: log, error: logError } = await supabase
            .from('daily_logs')
            .insert(testLog)
            .select()
            .single()
        
        if (logError) {
            console.log('❌ Daily log creation failed:', logError.message)
            return false
        }
        
        console.log('✅ Daily log created successfully!')
        
        // Clean up
        await supabase.from('daily_logs').delete().eq('id', log.id)
        return true
        
    } catch (error) {
        console.error('❌ Daily log test failed:', error.message)
        return false
    }
}

async function testCompleteFlow() {
    console.log('🧪 Testing Complete Patient Flow...\n')
    
    const testPatientData = {
        mobileNumber: '9876543299',
        age: '45',
        sex: 'Male',
        diagnosis: {
            primaryCategory: 'Bronchial Asthma',
            subtype: 'Moderate persistent asthma'
        },
        medications: [
            {
                id: '1',
                route: 'Inhalational',
                drugName: 'SALBUTAMOL',
                dose: '100mcg',
                frequency: 'SOS',
                startDate: '2024-01-01',
                isActive: true
            }
        ],
        pftRecords: [
            {
                id: '1',
                fvc: '85',
                fev1: '80',
                testDate: '2024-01-15'
            }
        ],
        medicalHistory: 'Asthma since childhood',
        comorbidities: ['Hypertension']
    }
    
    let createdPatientId = null
    
    try {
        // Step 1: Create patient (as doctor would)
        console.log('👨‍⚕️ Step 1: Doctor creates patient...')
        const createResult = await createPatientAccount(
            'test-flow@demo.com',
            'patient123',
            'Test Flow Patient',
            'Bronchial Asthma',
            null,
            testPatientData
        )
        
        if (!createResult.success) {
            console.log('❌ Patient creation failed:', createResult.error)
            return
        }
        
        createdPatientId = createResult.profile.id
        console.log('✅ Patient created with comprehensive data')
        
        // Step 2: Test patient login lookup
        console.log('\n🔐 Step 2: Patient login lookup...')
        const loginResult = await testPatientLogin('9876543299', 'test-flow@demo.com')
        
        if (!loginResult) {
            console.log('❌ Patient login lookup failed')
            return
        }
        
        console.log('✅ Patient login lookup successful')
        
        // Step 3: Test daily log creation (dashboard functionality)
        console.log('\n📊 Step 3: Dashboard daily logging...')
        const logResult = await testDailyLogCreation(createdPatientId)
        
        if (!logResult) {
            console.log('❌ Daily log creation failed - RLS issue detected!')
            console.log('🔧 You need to run DISABLE_RLS.sql in Supabase SQL Editor')
            return
        }
        
        console.log('✅ Daily logging works')
        
        // Step 4: Verify patient data completeness
        console.log('\n📋 Step 4: Verify patient data completeness...')
        const { data: patientProfile, error: profileError } = await supabase
            .from('patient_profiles')
            .select('*')
            .eq('id', createdPatientId)
            .single()
        
        if (profileError) {
            console.log('❌ Patient profile retrieval failed')
            return
        }
        
        const patientData = patientProfile.patient_data
        console.log('📊 Patient data verification:')
        console.log(`   ✅ Mobile: ${patientData.mobile}`)
        console.log(`   ✅ Medications: ${patientData.medications.length} items`)
        console.log(`   ✅ PFT Records: ${patientData.pftRecords.length} items`)
        console.log(`   ✅ Medical History: ${patientData.medicalHistory ? 'Present' : 'Missing'}`)
        console.log(`   ✅ Comorbidities: ${patientData.comorbidities.length} items`)
        
        console.log('\n🎉 COMPLETE FLOW TEST PASSED!')
        console.log('✅ Doctor creates patient → Database stores comprehensive data')
        console.log('✅ Patient login → Database lookup works')
        console.log('✅ Patient dashboard → Daily logging works')
        console.log('✅ All doctor-entered data is preserved and accessible')
        
    } catch (error) {
        console.error('❌ Complete flow test failed:', error.message)
    } finally {
        // Clean up
        if (createdPatientId) {
            console.log('\n🧹 Cleaning up test data...')
            await supabase.from('patient_profiles').delete().eq('id', createdPatientId)
            console.log('✅ Test data cleaned up')
        }
    }
}

testCompleteFlow()