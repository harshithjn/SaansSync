// Database Service - Connects your existing logic to real database
import { supabase } from './supabase'
import { PatientCredentials, AuthSession, LoginResponse } from './auth-types'
import { PatientData } from './patient-types'

// =====================================================
// AUTHENTICATION FUNCTIONS (Same interface as before)
// =====================================================

export async function validatePatientLogin(email: string, password: string): Promise<LoginResponse> {
    try {
        // Use Supabase auth for secure login
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password
        })

        if (error) {
            return {
                success: false,
                error: 'Invalid email or password'
            }
        }

        // Get patient data
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .single()

        if (patientError || !patient) {
            return {
                success: false,
                error: 'Patient data not found'
            }
        }

        // Create session (same format as before)
        const session: AuthSession = {
            patientId: patient.id,
            email: patient.email,
            role: "PATIENT",
            primaryDiagnosisCategory: patient.disease_type,
            token: data.session?.access_token || ''
        }

        return {
            success: true,
            session
        }

    } catch (error) {
        console.error('Login error:', error)
        return {
            success: false,
            error: 'Network error'
        }
    }
}

// =====================================================
// PATIENT CREDENTIALS CREATION
// =====================================================

// Generate UUID function
function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
    }
    // Fallback UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

export function createPatientCredentials(email: string): PatientCredentials {
    const patientId = generateUUID()
    const now = new Date().toISOString()
    
    return {
        patientId,
        email: email.toLowerCase().trim(),
        passwordHash: 'patient123', // In production, this would be properly hashed
        role: 'PATIENT',
        forcePasswordChange: false,
        createdAt: now,
        updatedAt: now
    }
}

export function getDashboardRoute(diseaseType: string): string {
    const routes: { [key: string]: string } = {
        'Asthma': '/patient/dashboard/asthma',
        'COPD': '/patient/dashboard/oad',
        'ILD': '/patient/dashboard/ild',
        'Bronchiectasis': '/patient/dashboard/bronchiectasis',
        'Post-Infection': '/patient/dashboard/post-icu'
    }
    
    return routes[diseaseType] || '/patient/dashboard/asthma'
}

// =====================================================
// PATIENT STORAGE (Same interface, now uses database)
// =====================================================

export async function storePatient(credentials: PatientCredentials, patientData: PatientData): Promise<void> {
    try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: credentials.email,
            password: 'patient123' // Default password
        })

        if (authError) {
            console.error('Auth creation error:', authError)
            return
        }

        // Store patient data
        const { error: insertError } = await supabase
            .from('patients')
            .insert({
                id: authData.user?.id,
                email: credentials.email,
                full_name: patientData.fullName,
                disease_type: patientData.diagnosis.primaryCategory as any,
                disease_subtype: patientData.diagnosis.subtype,
                patient_data: patientData
            })

        if (insertError) {
            console.error('Patient storage error:', insertError)
        }

    } catch (error) {
        console.error('Store patient error:', error)
    }
}

export async function getStoredPatients(): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('patients')
            .select('*')

        if (error) {
            console.error('Get patients error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Get stored patients error:', error)
        return []
    }
}

// =====================================================
// DAILY LOGGING (Same interface, now uses database)
// =====================================================

export async function createDailyLog(
    patientId: string,
    diseaseType: string,
    commonData: any,
    diseaseSpecificData: any,
    doctorId: string
): Promise<{ success: boolean; logEntry?: any; alert?: any; error?: string }> {
    try {
        // Check daily limit
        const today = new Date().toISOString().split('T')[0]
        const { count } = await supabase
            .from('daily_logs')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patientId)
            .eq('log_date', today)

        if ((count || 0) >= 2) {
            return {
                success: false,
                error: 'Daily logging limit reached (2 logs per day maximum)'
            }
        }

        // Calculate red flag score (use your existing logic)
        const { calculateRedFlagScore } = await import('./red-flag-scoring')
        const redFlagResult = calculateRedFlagScore({
            patientId,
            diagnosis: diseaseType as any,
            spo2: commonData.spo2?.atRest || 95,
            hasHemoptysis: diseaseSpecificData.hasHemoptysis || false,
            mMRCIncrease: false, // Calculate based on previous logs
            medCompliance: true, // Calculate from medications
            vasSymptomScore: Math.max(...Object.values(commonData.symptoms || {}).map((s: any) => s.score || 0)),
            aqi: commonData.aqi?.value || 100,
            diseaseData: diseaseSpecificData
        })

        // Insert log
        const { data: logData, error: logError } = await supabase
            .from('daily_logs')
            .insert({
                patient_id: patientId,
                log_date: today,
                spo2_at_rest: commonData.spo2?.atRest,
                spo2_on_exertion: commonData.spo2?.onExertion,
                mmrc_scale: commonData.mMRCScale,
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

        // Create alert if needed
        let alert = null
        if (redFlagResult.score >= 4) {
            alert = await createAlert(patientId, doctorId, redFlagResult)
        }

        return {
            success: true,
            logEntry: logData,
            alert
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
// ALERT SYSTEM (Same interface, now uses database)
// =====================================================

async function createAlert(patientId: string, doctorId: string, redFlagResult: any) {
    try {
        const { data, error } = await supabase
            .from('alerts')
            .insert({
                patient_id: patientId,
                doctor_id: doctorId,
                type: redFlagResult.level,
                message: `Red flag score: ${redFlagResult.score}/10`,
                factors: redFlagResult.factors,
                red_flag_score: redFlagResult.score
            })
            .select()
            .single()

        if (error) {
            console.error('Create alert error:', error)
            return null
        }

        return data
    } catch (error) {
        console.error('Create alert error:', error)
        return null
    }
}

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

// =====================================================
// DOCTOR FUNCTIONS (Same interface, now uses database)
// =====================================================

export async function getDoctorPatients(doctorId: string) {
    try {
        const { data, error } = await supabase
            .from('doctor_dashboard_view')
            .select('*')
            .eq('doctor_id', doctorId)

        if (error) {
            console.error('Get doctor patients error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Get doctor patients error:', error)
        return []
    }
}

export async function getDoctorAlerts(doctorId: string) {
    try {
        const { data, error } = await supabase
            .from('alerts')
            .select(`
                *,
                patients!inner(full_name, disease_type)
            `)
            .eq('doctor_id', doctorId)
            .eq('acknowledged', false)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Get doctor alerts error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Get doctor alerts error:', error)
        return []
    }
}

// =====================================================
// SESSION MANAGEMENT (Keep same interface)
// =====================================================

export function getStoredSession(): AuthSession | null {
    if (typeof window === 'undefined') return null

    try {
        const stored = localStorage.getItem('patient_session')
        return stored ? JSON.parse(stored) : null
    } catch (error) {
        console.error('Error reading session:', error)
        return null
    }
}

export function storeSession(session: AuthSession): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('patient_session', JSON.stringify(session))
}

export function clearSession(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('patient_session')
    supabase.auth.signOut()
}