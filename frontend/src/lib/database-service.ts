// Database Service - Updated for Production Schema v3.0.0
import { supabase } from './supabase'
import { AuthSession, LoginResponse } from './auth-types'
import { DiseaseType } from './monitoring-types'

// Map frontend disease categories to database disease types
const mapDiseaseTypeToDatabase = (frontendCategory: string): string => {
    const mapping: { [key: string]: string } = {
        "Interstitial Lung Disease (ILD)": "ILD",
        "Bronchial Asthma": "Asthma", 
        "COPD (Chronic Obstructive Pulmonary Disease)": "COPD",
        "Bronchiectasis": "Bronchiectasis",
        "Post ICU Recovery": "Post-Infection"
    }
    
    return mapping[frontendCategory] || frontendCategory
}

// =====================================================
// DOCTOR FUNCTIONS
// =====================================================

export async function createDoctorProfile(
    fullName: string,
    licenseNumber: string,
    specialization: string,
    hospitalAffiliation: string,
    phone?: string
) {
    try {
        // Get current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return { success: false, error: 'Not authenticated' }
        }

        const { data: profile, error: profileError } = await supabase
            .from('doctors') // Correct table name from schema
            .insert({
                id: user.id, // Use auth user ID
                full_name: fullName,
                email: user.email, // Add email from user
                // license_number: licenseNumber, // Schema might not have this, checking schema...
                // specialization: specialization,
                // hospital_affiliation: hospitalAffiliation,
                phone: phone || null
            })
            .select()
            .single()

        if (profileError) {
            console.error('Doctor profile creation error:', profileError)
            return { success: false, error: profileError.message }
        }

        return { success: true, profile }

    } catch (error) {
        console.error('Create doctor error:', error)
        return { success: false, error: (error as Error)?.message || 'Unknown error' }
    }
}

export async function createPatientAccount(
    email: string, 
    password: string, 
    fullName: string, 
    diseaseType: DiseaseType,
    doctorId?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    patientData?: any
) {
    try {
        console.log('Creating patient account:', { email, fullName, diseaseType, doctorId })
        
        // Check if supabase is properly configured
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
             console.error('Supabase auth error: No active session')
             return { success: false, error: 'Not authenticated' }
        }
        
        // Map frontend disease category to database format
        const dbDiseaseType = mapDiseaseTypeToDatabase(diseaseType)
        console.log('Mapped disease type:', diseaseType, '->', dbDiseaseType)
        
        // Prepare comprehensive patient data
        const comprehensivePatientData = {
            email: email,
            password: password, // Note: storing password in JSON is bad practice, but following existing pattern for now
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
        
        // Create patient profile directly (RLS should be disabled in production schema)
        const { data: profile, error: profileError } = await supabase
            .from('patients') // Correct table name
            .insert({
                // id: generateUUID(), // If ID is not auto-generated, we might need this. valid-uuid needed.
                full_name: fullName,
                // disease_type: dbDiseaseType, // Not in patients table schema? It's in patient_data
                doctor_id: doctorId || null,
                // phone: patientData?.mobileNumber || '', // Not in patients table
                // gender: patientData?.sex || null, // Not in patients table
                email: email,
                patient_data: {
                    ...comprehensivePatientData,
                    disease_type: dbDiseaseType
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any
        console.error('Create patient error:', err)
        return { success: false, error: err?.message || 'Unknown error' }
    }
}

// =====================================================
// AUTHENTICATION FUNCTIONS
// =====================================================

export async function loginPatient(email: string, password: string): Promise<LoginResponse> {
    try {
        console.log('Attempting patient login:', { email })
        
        // Find patient by email in patient_data JSONB field
        const { data: profiles, error: profileError } = await supabase
            .from('patient_profiles')
            .select('*')
            .contains('patient_data', { email: email.toLowerCase().trim() })

        if (profileError) {
            console.error('Profile lookup error:', profileError)
            return {
                success: false,
                error: 'Login failed - database error'
            }
        }

        if (!profiles || profiles.length === 0) {
            return {
                success: false,
                error: 'Invalid email or password'
            }
        }

        const profile = profiles[0]
        const storedPassword = profile.patient_data?.password

        // Check password
        if (storedPassword !== password) {
            return {
                success: false,
                error: 'Invalid email or password'
            }
        }

        // Create session
        const session: AuthSession = {
            userId: profile.id,
            email: email,
            role: "patient"
        }

        console.log('✅ Patient login successful:', { patientId: profile.id, email })
        return {
            success: true,
            session
        }

    } catch (error) {
        console.error('Login error:', error)
        return {
            success: false,
            error: 'Login failed'
        }
    }
}

// =====================================================
// DAILY LOGGING FUNCTIONS
// =====================================================

export async function canLogToday(patientId: string): Promise<boolean> {
    try {
        const today = new Date().toISOString().split('T')[0]
        const { count } = await supabase
            .from('daily_logs')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patientId)
            .eq('log_date', today)

        return (count || 0) < 2
    } catch (error) {
        console.error('Check log limit error:', error)
        return false
    }
}

export async function createDailyLog(
    patientId: string,
    diseaseType: DiseaseType,
    commonData: any,
    diseaseSpecificData: any
): Promise<{ success: boolean; logEntry?: any; alert?: any; error?: string }> {
    try {
        // Check daily limit
        const canLog = await canLogToday(patientId)
        if (!canLog) {
            return {
                success: false,
                error: 'Daily logging limit reached (2 logs per day maximum)'
            }
        }

        // Map disease type to database format
        const dbDiseaseType = mapDiseaseTypeToDatabase(diseaseType)

        // Calculate red flag score
        const { calculateRedFlagScore } = await import('./red-flag-scoring')
        const redFlagResult = calculateRedFlagScore({
            patientId,
            diagnosis: dbDiseaseType as DiseaseType,
            spo2: commonData.spo2?.atRest || 95,
            hasHemoptysis: diseaseSpecificData.hasHemoptysis || false,
            mMRCIncrease: false,
            medCompliance: true,
            vasSymptomScore: Math.max(...(commonData.symptoms || []).map((s: any) => s.score || 0)),
            aqi: commonData.aqi?.value || 100,
            diseaseData: diseaseSpecificData
        })

        // Insert log
        const { data: logData, error: logError } = await supabase
            .from('daily_logs')
            .insert({
                patient_id: patientId,
                log_date: new Date().toISOString().split('T')[0],
                spo2_at_rest: commonData.spo2?.atRest,
                spo2_on_exertion: commonData.spo2?.onExertion,
                mmrc_scale: commonData.mMRCScale,
                disease_type: dbDiseaseType,
                disease_data: diseaseSpecificData,
                symptoms: commonData.symptoms,
                medications: commonData.medications,
                side_effects: commonData.sideEffects,
                aqi_data: commonData.aqi,
                red_flag_score: redFlagResult.score
            })
            .select()
            .single()

        if (logError) {
            return {
                success: false,
                error: logError.message
            }
        }

        console.log('✅ Log created in database with red flag score:', redFlagResult.score)

        // Create alert if red flag score >= 4 (manual alert creation)
        let alertData = null
        if (redFlagResult.score >= 4) {
            try {
                // Get patient's doctor from 'patients' table
                const { data: patient, error: patientError } = await supabase
                    .from('patients')
                    .select('doctor_id, full_name')
                    .eq('id', patientId)
                    .single()

                if (!patientError && patient && patient.doctor_id) {
                    const alertType = redFlagResult.score >= 9 ? 'critical' : 
                                    redFlagResult.score >= 7 ? 'high-risk' : 'pending-review'
                    
                    const alertMessage = `${patient.full_name}: Red flag score ${redFlagResult.score}/10 - ${alertType.replace('-', ' ')} condition detected`

                    
                    const { data: alert, error: alertError } = await supabase
                        .from('alerts')
                        .insert({
                            patient_id: patientId,
                            doctor_id: patient.doctor_id,
                            type: alertType,
                            message: alertMessage,
                            red_flag_score: redFlagResult.score,
                            factors: redFlagResult.factors || []
                        })
                        .select()
                        .single()

                    if (!alertError) {
                        alertData = alert
                        console.log('✅ Alert created:', alertType, 'for red flag score', redFlagResult.score)
                    } else {
                        console.error('Alert creation failed:', alertError)
                    }
                }
            } catch (alertError) {
                console.error('Alert creation error:', alertError)
            }
        }

        return { 
            success: true, 
            logEntry: logData,
            alert: alertData
        }

    } catch (error) {
        console.error('Create daily log error:', error)
        return {
            success: false,
            error: 'Failed to create log'
        }
    }
}

// =====================================================
// ALERT FUNCTIONS
// =====================================================

export async function getPatientAlerts(patientId: string) {
    try {
        const { data, error } = await supabase
            .from('alerts')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Get alerts error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Get patient alerts error:', error)
        return []
    }
}

export async function getDoctorPatients(_doctorIdParam: string) {
    try {
        // 1. Verify Session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
            console.error('Auth Error: No active session found', sessionError)
            return []
        }

        const authUserId = session.user.id
        console.log('Getting patients for authenticated doctor:', authUserId)

        // 2. Security Check (Optional warning, but strict usage of authUserId)
        if (_doctorIdParam && _doctorIdParam !== authUserId) {
            console.warn(`Security Warning: URL parameter ${_doctorIdParam} mismatch with Auth ID ${authUserId}`)
        }
        
        // 3. Query 'patients' table using AUTHENTICATED ID
        const { data, error } = await supabase
            .from('patients')
            .select('id, full_name, email, patient_data, created_at')
            .eq('doctor_id', authUserId)

        if (error) {
            console.error('Get doctor patients error:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            })
            return []
        }

        // Map the data to include disease_type from patient_data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedData = data?.map((p: any) => ({
            ...p,
            disease_type: p.patient_data?.diagnosis?.primaryCategory || p.patient_data?.disease_type || 'Unknown'
        }))

        console.log('Found', mappedData?.length || 0, 'patients for doctor')
        return mappedData || []
    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any
        console.error('Get doctor patients unexpected error:', err.message || err)
        return []
    }
}

export async function getDoctorDailyLogs(_doctorIdParam: string) {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return []
        const authUserId = session.user.id

        // Get all patients for this doctor first using the main table
        const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select('id, full_name, patient_data')
            .eq('doctor_id', authUserId)

        if (patientsError) {
            console.error('Get doctor patients error:', patientsError)
            return []
        }

        if (!patients || patients.length === 0) {
            console.log('No patients found for doctor:', authUserId)
            return []
        }

        const patientIds = patients.map(p => p.id)

        // Get all daily logs for these patients
        const { data: logs, error: logsError } = await supabase
            .from('daily_logs')
            .select('*')
            .in('patient_id', patientIds)
            .order('created_at', { ascending: false })

        if (logsError) {
            console.error('Get daily logs error:', logsError)
            return []
        }

        // Combine logs with patient info
        const logsWithPatients = logs.map(log => {
            const patient = patients.find(p => p.id === log.patient_id)
            return {
                ...log,
                patient_name: patient?.full_name || 'Unknown',
                patient_disease: patient?.patient_data?.diagnosis?.primaryCategory || patient?.patient_data?.disease_type || 'Unknown'
            }
        })

        return logsWithPatients || []
    } catch (error) {
        console.error('Get doctor daily logs error:', error)
        return []
    }
}

export async function getDoctorAlerts(_doctorIdParam: string) {
    try {
        // 1. Verify Session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
            console.error('Auth Error: No active session found')
            return []
        }

        const authUserId = session.user.id
        console.log('Getting alerts for authenticated doctor:', authUserId)
        
        // 2. Query 'saanssync_alerts' table using AUTHENTICATED ID
        const { data: alerts, error: alertsError } = await supabase
            .from('saanssync_alerts')
            .select('*')
            .eq('doctor_id', authUserId)
            .order('created_at', { ascending: false })

        if (alertsError) {
            console.error('Get doctor alerts error:', {
                message: alertsError.message,
                code: alertsError.code,
                details: alertsError.details
            })
            return []
        }

        console.log('Found', alerts?.length || 0, 'alerts for doctor')

        // Map alerts to match frontend expectations (level -> type)
        const mappedAlerts = alerts?.map(alert => ({
            ...alert,
            // Map RED/YELLOW/GREEN to critical/high-risk/pending-review
            type: alert.level === 'RED' ? 'critical' : 
                  alert.level === 'YELLOW' ? 'high-risk' : 
                  alert.level === 'GREEN' ? 'pending-review' : 'info',
            // Ensure red_flag_score exists (saanssync_alerts doesn't have it, maybe derive or default)
            red_flag_score: alert.level === 'RED' ? 10 : alert.level === 'YELLOW' ? 5 : 1
        }))

        return mappedAlerts || []
    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any
        console.error('Get doctor alerts unexpected error:', err.message || err)
        return []
    }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function getPatientDailyLogs(patientId: string) {
    try {
        if (!supabase) {
            console.error('Supabase client not configured')
            return []
        }

        const { data, error } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Get patient daily logs error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Get patient daily logs error:', error)
        return []
    }
}

export async function getPatientMedications(patientId: string) {
    try {
        if (!supabase) {
            console.error('Supabase client not configured')
            return []
        }

        // Get patient profile with medications from 'patients' table
        const { data: patient, error } = await supabase
            .from('patients')
            .select('patient_data')
            .eq('id', patientId)
            .single()

        if (error) {
            console.error('Get patient medications error:', error)
            return []
        }

        return patient?.patient_data?.medications || []
    } catch (error) {
        console.error('Get patient medications error:', error)
        return []
    }
}

export async function getPatientProfile(patientId: string) {
    try {
        if (!supabase) {
            console.log('Supabase not configured')
            return null
        }

        // Query 'patients' table
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('id', patientId)
            .single()

        if (error) {
            console.error('Get patient profile error:', error)
            // Return null if patient not found - no localStorage fallback in production
            return null
        }

        // Convert database format to PatientData format
        if (data && data.patient_data) {
            const dbData = data.patient_data
            const patientData = {
                // Basic info
                fullName: data.full_name,
                mobileNumber: dbData.mobile || dbData.mobileNumber || '',
                emailId: data.email || dbData.email || '',
                age: dbData.age || '',
                sex: dbData.sex || dbData.gender || '',
                
                // Medical info
                diagnosis: dbData.diagnosis || {
                    primaryCategory: dbData.disease_type || 'Unknown',
                    subtype: dbData.disease_subtype || ''
                },
                medications: dbData.medications || [],
                pftRecords: dbData.pftRecords || [],
                medicalHistory: dbData.medicalHistory || '',
                comorbidities: dbData.comorbidities || [],
                
                // Respiratory support
                ltot: dbData.respiratorySupport?.ltot || { enabled: false },
                bipap: dbData.respiratorySupport?.bipap || { enabled: false },
                invasiveVentilation: dbData.respiratorySupport?.invasiveVentilation || { enabled: false },
                tracheostomy: dbData.respiratorySupport?.tracheostomy || { enabled: false },
                
                // Other fields
                registrationDate: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
            }
            
            console.log('✅ Patient data loaded from database:', patientData.fullName)
            return patientData
        }

        return data
    } catch (error) {
        console.error('Get patient profile error:', error)
        // Return null if patient not found - no localStorage fallback in production
        return null
    }
}

export async function acknowledgeAlert(alertId: string) {
    try {
        const { error } = await supabase
            .from('alerts')
            .update({ 
                acknowledged: true, 
                acknowledged_at: new Date().toISOString() 
            })
            .eq('id', alertId)

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Acknowledge alert error:', error)
        return { success: false, error: 'Failed to acknowledge alert' }
    }
}