// Production Authentication Service with Supabase
import { supabase } from './supabase'

export interface DoctorProfile {
  id: string
  auth_user_id?: string
  email: string
  full_name: string
  phone?: string
  approval_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface PatientProfile {
  id: string
  auth_user_id: string
  phone: string
  full_name?: string
  patient_data: any
  created_at: string
  updated_at: string
}

// =====================================================
// DOCTOR AUTHENTICATION (Email OTP Only)
// =====================================================

export async function signUpDoctor(
  email: string,
  fullName: string,
  phone?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    console.log('🩺 Doctor registration for:', email)
    
    // Create doctor record directly in database (no Supabase auth user yet)
    const serviceClient = createServiceClient()
    
    const { data, error } = await serviceClient
      .from('doctors')
      .insert({
        email: email.trim(),
        full_name: fullName.trim(),
        phone: phone?.trim() || null,
        approval_status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Doctor registration error:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error details:', error.details)
      
      if (error.code === '23505') { // unique constraint violation
        return { 
          success: false, 
          error: 'Email already registered. Please use a different email or contact support.' 
        }
      }
      
      if (error.code === '23503') { // foreign key constraint violation
        return { 
          success: false, 
          error: 'Database constraint error. Please try again or contact support.' 
        }
      }
      
      return { success: false, error: `Registration failed: ${error.message}` }
    }

    console.log('✅ Doctor registered successfully:', data.id)
    
    return {
      success: true,
      message: 'Registration successful! Your application has been submitted for admin review. You will be able to login once approved.'
    }

  } catch (error) {
    console.error('❌ Doctor registration error:', error)
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message
      if (errorMessage.includes('Service role key not configured')) {
        return { success: false, error: 'Registration system not configured. Please contact support.' }
      }
      return { success: false, error: errorMessage }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function signInDoctorWithOTP(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 Sending OTP to doctor:', email)
    
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false // Only existing users
      }
    })

    if (error) {
      console.error('❌ OTP send error:', error)
      if (error.message.includes('rate limit')) {
        return { success: false, error: 'Too many requests. Please wait a few minutes.' }
      }
      if (error.message.includes('not found')) {
        return { success: false, error: 'Email not found. Please register first.' }
      }
      return { success: false, error: error.message }
    }

    console.log('✅ OTP sent successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ OTP send error:', error)
    return { success: false, error: 'Failed to send OTP' }
  }
}

export async function verifyDoctorOTP(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string; doctorProfile?: DoctorProfile }> {
  try {
    console.log('🔐 Verifying OTP for:', email)
    
    // Ensure token is exactly 6 digits
    const cleanToken = token.replace(/\D/g, '').slice(0, 6)
    if (cleanToken.length !== 6) {
      return { success: false, error: 'OTP must be exactly 6 digits' }
    }
    
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: cleanToken,
      type: 'email'
    })

    if (authError) {
      console.error('❌ OTP verification error:', authError)
      if (authError.message.includes('expired') || authError.message.includes('invalid')) {
        return { 
          success: false, 
          error: 'OTP expired or invalid. Please request a new OTP and try again.' 
        }
      }
      return { success: false, error: authError.message }
    }

    if (!authData.user || !authData.session) {
      return { success: false, error: 'OTP verification failed' }
    }

    console.log('✅ OTP verified for user:', authData.user.id)

    // Get doctor profile using auth_user_id first, then fallback to email
    console.log('🔍 Looking for doctor with auth_user_id:', authData.user.id)
    
    let { data: doctorProfile, error: profileError } = await supabase
      .from('doctors')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single()

    console.log('👨‍⚕️ Doctor profile query result:', { data: doctorProfile, error: profileError })

    if (profileError || !doctorProfile) {
      console.error('❌ Doctor profile not found by auth_user_id:', profileError)
      
      // Fallback: search by email and try to link the auth_user_id
      console.log('🔍 Fallback: Looking for doctor with email:', email)
      const { data: fallbackProfile, error: fallbackError } = await supabase
        .from('doctors')
        .select('*')
        .eq('email', email.trim())
        .eq('approval_status', 'approved')
        .single()
      
      console.log('👨‍⚕️ Fallback profile query result:', { data: fallbackProfile, error: fallbackError })
      
      if (fallbackError || !fallbackProfile) {
        // Sign out since no valid doctor profile
        await supabase.auth.signOut()
        return { success: false, error: 'Doctor profile not found or not approved. Please contact support.' }
      }
      
      // If we found the doctor by email but auth_user_id is missing, try to link it
      if (!fallbackProfile.auth_user_id) {
        console.log('🔗 Attempting to link auth_user_id to doctor profile...')
        
        const serviceClient = createServiceClient()
        const { error: linkError } = await serviceClient
          .from('doctors')
          .update({ auth_user_id: authData.user.id })
          .eq('id', fallbackProfile.id)
        
        if (linkError) {
          console.error('❌ Failed to link auth_user_id:', linkError)
        } else {
          console.log('✅ Successfully linked auth_user_id to doctor profile')
          fallbackProfile.auth_user_id = authData.user.id
        }
      }
      
      // Use fallback profile
      doctorProfile = fallbackProfile
    }

    console.log('👨‍⚕️ Doctor approval status:', doctorProfile.approval_status)

    // STRICT APPROVAL CHECK
    if (doctorProfile.approval_status !== 'approved') {
      // Sign out immediately - unapproved doctors cannot stay logged in
      await supabase.auth.signOut()
      
      if (doctorProfile.approval_status === 'pending') {
        return { 
          success: false, 
          error: 'Account pending approval. Please wait for admin approval.',
          doctorProfile
        }
      } else if (doctorProfile.approval_status === 'rejected') {
        return { 
          success: false, 
          error: 'Account rejected. Please contact support.',
          doctorProfile
        }
      }
    }

    console.log('🎉 Doctor login successful')
    return {
      success: true,
      doctorProfile
    }

  } catch (error) {
    console.error('❌ OTP verification error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// PATIENT AUTHENTICATION (Phone OTP Only)
// =====================================================

export async function signInPatientWithOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📱 Sending SMS OTP to:', phoneNumber)
    
    // Clean and validate phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Validate Indian mobile number (10 digits, starts with 6-9)
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' }
    }
    
    if (!/^[6-9]/.test(cleanPhone)) {
      return { success: false, error: 'Please enter a valid Indian mobile number.' }
    }
    
    const formattedPhone = `+91${cleanPhone}`
    console.log('📱 Formatted phone for Twilio:', formattedPhone)

    // First, check if patient exists in our database
    console.log('🔍 Searching for patient with phone:', cleanPhone)
    console.log('🔍 Original phone input:', phoneNumber)
    console.log('🔍 Formatted phone for search:', cleanPhone)
    
    const { data: existingPatient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', cleanPhone)
      .single()

    console.log('📋 Database search result:', { existingPatient, patientError })

    if (patientError && patientError.code !== 'PGRST116') {
      console.error('❌ Database error:', patientError)
      return { success: false, error: 'Database error occurred' }
    }

    if (!existingPatient) {
      // Enhanced debug: Let's check all patients and their phone formats
      console.log('🔍 Patient not found. Running comprehensive debug...')
      
      const { data: allPatients, error: debugError } = await supabase
        .from('patients')
        .select('id, phone, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
      
      console.log('🔍 Debug - All recent patients in database:', allPatients)
      console.log('🔍 Debug - Looking for phone:', cleanPhone)
      console.log('🔍 Debug - Phone length:', cleanPhone.length)
      
      // Try different phone format searches
      const phoneVariations = [
        cleanPhone,
        `+91${cleanPhone}`,
        cleanPhone.substring(1), // Remove first digit
        `0${cleanPhone}`, // Add leading zero
      ]
      
      for (const variation of phoneVariations) {
        const { data: variantResult } = await supabase
          .from('patients')
          .select('id, phone, full_name')
          .eq('phone', variation)
          .limit(1)
        
        if (variantResult && variantResult.length > 0) {
          console.log(`🎯 Found patient with phone variation "${variation}":`, variantResult[0])
        }
      }
      
      // Also search by partial phone match
      const { data: partialMatches } = await supabase
        .from('patients')
        .select('id, phone, full_name')
        .ilike('phone', `%${cleanPhone.substring(-8)}%`) // Last 8 digits
        .limit(5)
      
      console.log('🔍 Debug - Partial phone matches (last 8 digits):', partialMatches)
      
      return { success: false, error: `Phone number not registered. Please contact your doctor to verify your phone number is correctly saved as: ${cleanPhone}` }
    }

    // Use Supabase phone auth with Twilio
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        data: {
          role: 'patient',
          patient_id: existingPatient.id
        }
      }
    })

    if (error) {
      console.error('❌ SMS OTP error:', error)
      
      if (error.message.includes('rate limit')) {
        return { success: false, error: 'Too many requests. Please wait a few minutes before trying again.' }
      }
      
      if (error.message.includes('Invalid phone number')) {
        return { success: false, error: 'Invalid phone number format. Please check and try again.' }
      }
      
      if (error.message.includes('SMS') || error.message.includes('provider')) {
        return { success: false, error: 'SMS service temporarily unavailable. Please try again later.' }
      }
      
      return { success: false, error: error.message }
    }

    console.log('✅ SMS OTP sent successfully via Twilio')
    return { success: true }
  } catch (error) {
    console.error('❌ SMS OTP error:', error)
    return { success: false, error: 'Failed to send SMS OTP. Please try again.' }
  }
}

export async function verifyPatientOTP(
  phoneNumber: string, 
  token: string
): Promise<{ success: boolean; error?: string; patientProfile?: PatientProfile }> {
  try {
    console.log('🔐 Verifying SMS OTP for:', phoneNumber)
    
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const formattedPhone = `+91${cleanPhone}`

    // Use Supabase auth verification with Twilio
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: token.trim(),
      type: 'sms'
    })

    if (authError) {
      console.error('❌ SMS OTP verification error:', authError)
      
      if (authError.message.includes('expired')) {
        return { success: false, error: 'OTP expired. Please request a new one.' }
      }
      
      if (authError.message.includes('invalid') || authError.message.includes('Token')) {
        return { success: false, error: 'Invalid OTP. Please check and try again.' }
      }
      
      if (authError.message.includes('rate limit')) {
        return { success: false, error: 'Too many attempts. Please wait before trying again.' }
      }
      
      return { success: false, error: 'OTP verification failed. Please try again.' }
    }

    if (!authData.user || !authData.session) {
      return { success: false, error: 'Authentication failed. Please try again.' }
    }

    console.log('✅ SMS OTP verified for user:', authData.user.id)

    // Get patient profile - first try by auth_user_id, then by phone
    let patientProfile = null
    
    // Try to get patient by auth_user_id (if profile was linked)
    const { data: authLinkedPatient, error: authLinkedError } = await supabase
      .from('patients')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single()

    if (authLinkedPatient) {
      patientProfile = authLinkedPatient
    } else {
      // Fallback: get patient by phone number and link auth_user_id
      const { data: phonePatient, error: phoneError } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', cleanPhone)
        .single()

      if (phoneError || !phonePatient) {
        console.error('❌ Patient profile not found:', phoneError)
        return { success: false, error: 'Patient profile not found. Please contact your doctor.' }
      }

      // Link the auth user to the patient profile
      const { data: updatedPatient, error: updateError } = await supabase
        .from('patients')
        .update({ auth_user_id: authData.user.id })
        .eq('id', phonePatient.id)
        .select()
        .single()

      if (updateError) {
        console.warn('⚠️ Failed to link auth user to patient profile:', updateError)
        patientProfile = phonePatient // Use unlinked profile
      } else {
        patientProfile = updatedPatient
        console.log('✅ Linked auth user to patient profile')
      }
    }

    console.log('🎉 Patient login successful via Twilio SMS')
    return {
      success: true,
      patientProfile
    }

  } catch (error) {
    console.error('❌ SMS OTP verification error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// =====================================================
// GENERAL AUTH FUNCTIONS
// =====================================================

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    return error ? null : user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    return !error
  } catch (error) {
    console.error('Sign out error:', error)
    return false
  }
}

export async function getCurrentUserProfile(): Promise<{ role: 'doctor' | 'patient' | null; profile: any | null; approved?: boolean }> {
  try {
    const user = await getCurrentUser()
    if (!user) return { role: null, profile: null }

    // Check if user is a doctor
    const { data: doctorProfile } = await supabase
      .from('doctors')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (doctorProfile) {
      return {
        role: 'doctor',
        profile: doctorProfile,
        approved: doctorProfile.approval_status === 'approved'
      }
    }

    // Check if user is a patient
    const { data: patientProfile } = await supabase
      .from('patients')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (patientProfile) {
      return {
        role: 'patient',
        profile: patientProfile,
        approved: true // Patients don't need approval
      }
    }

    return { role: null, profile: null }
  } catch (error) {
    console.error('Get current user profile error:', error)
    return { role: null, profile: null }
  }
}

export async function findPatientByPhone(phoneNumber: string): Promise<{ found: boolean; patient?: any; error?: string }> {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    console.log('🔍 Manual search for phone:', cleanPhone)
    
    const { data: patient, error } = await supabase
      .from('patients')
      .select('id, phone, full_name, email, created_at')
      .eq('phone', cleanPhone)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      return { found: false, error: error.message }
    }
    
    if (patient) {
      console.log('✅ Patient found:', patient)
      return { found: true, patient }
    } else {
      console.log('❌ Patient not found')
      return { found: false }
    }
  } catch (error) {
    console.error('❌ Search error:', error)
    return { found: false, error: 'Search failed' }
  }
}

export async function debugPatientPhoneNumbers(): Promise<void> {
  try {
    console.log('🔍 DEBUG: Checking all patients in database...')
    
    const { data: allPatients, error } = await supabase
      .from('patients')
      .select('id, phone, full_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('❌ Debug query error:', error)
      return
    }
    
    console.log('📋 All recent patients:')
    allPatients?.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.full_name || 'No name'}`)
      console.log(`   Phone: "${patient.phone}" (length: ${patient.phone?.length || 0})`)
      console.log(`   Email: ${patient.email || 'No email'}`)
      console.log(`   Created: ${patient.created_at}`)
      console.log('   ---')
    })
    
  } catch (error) {
    console.error('❌ Debug function error:', error)
  }
}

// =====================================================
// ADMIN FUNCTIONS (Service Role Required)
// =====================================================

// Create service role client for admin operations (singleton)
let serviceClient: any = null

const createServiceClient = () => {
  if (serviceClient) {
    return serviceClient
  }

  const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  console.log('🔑 Service key exists:', !!serviceKey)
  console.log('🌐 Supabase URL:', supabaseUrl)
  
  if (!serviceKey) {
    throw new Error('Service role key not configured')
  }
  
  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured')
  }
  
  const { createClient } = require('@supabase/supabase-js')
  serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-service-role'
      }
    }
  })
  
  return serviceClient
}

export async function getAllDoctors(): Promise<DoctorProfile[]> {
  try {
    console.log('👨‍💼 Admin: Getting all doctors...')
    
    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient.rpc('get_all_doctors')

    if (error) {
      console.error('❌ Get all doctors error:', error)
      return []
    }

    console.log('✅ Retrieved doctors:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Get all doctors error:', error)
    return []
  }
}

export async function approveDoctorAccount(doctorId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('✅ Admin: Approving doctor:', doctorId)
    
    const serviceClient = createServiceClient()
    
    // Get doctor details first
    const { data: doctorData, error: doctorError } = await serviceClient
      .from('doctors')
      .select('email, full_name, phone, approval_status')
      .eq('id', doctorId)
      .single()

    if (doctorError || !doctorData) {
      console.error('❌ Failed to get doctor data:', doctorError)
      return { success: false, error: 'Failed to get doctor information' }
    }

    if (doctorData.approval_status === 'approved') {
      return { success: false, error: 'Doctor is already approved' }
    }

    console.log('👨‍⚕️ Doctor data:', doctorData)

    // Create Supabase auth user for the doctor
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: doctorData.email,
      password: Math.random().toString(36).substring(2, 15), // Random password - will use OTP
      email_confirm: true, // Skip email verification
      user_metadata: {
        full_name: doctorData.full_name,
        phone: doctorData.phone || '',
        role: 'doctor'
      }
    })

    if (authError) {
      console.error('❌ Failed to create auth user:', authError)
      return { success: false, error: `Failed to create login account: ${authError.message}` }
    }

    console.log('✅ Auth user created:', authData.user?.id)

    // Update doctor record with auth_user_id and approval status
    const { error: updateError } = await serviceClient
      .from('doctors')
      .update({ 
        auth_user_id: authData.user?.id,
        approval_status: 'approved', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', doctorId)

    if (updateError) {
      console.error('❌ Failed to update doctor record:', updateError)
      // Clean up the auth user if doctor update fails
      await serviceClient.auth.admin.deleteUser(authData.user?.id || '')
      return { success: false, error: 'Failed to update doctor record' }
    }

    console.log('✅ Doctor approved and linked successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Approve doctor error:', error)
    return { success: false, error: 'Failed to approve doctor' }
  }
}

export async function rejectDoctorAccount(doctorId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('❌ Admin: Rejecting doctor:', doctorId)
    
    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from('doctors')
      .update({ 
        approval_status: 'rejected', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', doctorId)

    if (error) {
      console.error('❌ Reject doctor error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Doctor rejected successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Reject doctor error:', error)
    return { success: false, error: 'Failed to reject doctor' }
  }
}

export async function fixApprovedDoctors(): Promise<{ success: boolean; fixed: number; error?: string }> {
  try {
    console.log('🔧 Fixing approved doctors without auth_user_id...')
    
    const serviceClient = createServiceClient()
    
    // Get approved doctors without auth_user_id
    const { data: doctorsToFix, error: queryError } = await serviceClient
      .from('doctors')
      .select('*')
      .eq('approval_status', 'approved')
      .is('auth_user_id', null)

    if (queryError) {
      console.error('❌ Failed to query doctors:', queryError)
      return { success: false, fixed: 0, error: queryError.message }
    }

    if (!doctorsToFix || doctorsToFix.length === 0) {
      console.log('✅ No doctors need fixing')
      return { success: true, fixed: 0 }
    }

    console.log(`🔧 Found ${doctorsToFix.length} doctors to fix`)

    let fixedCount = 0
    for (const doctor of doctorsToFix) {
      try {
        console.log(`🔧 Processing doctor: ${doctor.email}`)
        
        // Check if auth user already exists for this email
        const { data: existingUser, error: userCheckError } = await serviceClient.auth.admin.listUsers()
        
        let authUserId = null
        if (!userCheckError && existingUser?.users) {
          const existingAuthUser = existingUser.users.find((u: any) => u.email === doctor.email)
          if (existingAuthUser) {
            console.log(`✅ Found existing auth user for ${doctor.email}:`, existingAuthUser.id)
            authUserId = existingAuthUser.id
          }
        }
        
        // Create auth user if it doesn't exist
        if (!authUserId) {
          console.log(`🔧 Creating new auth user for ${doctor.email}`)
          const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
            email: doctor.email,
            password: Math.random().toString(36).substring(2, 15),
            email_confirm: true,
            user_metadata: {
              full_name: doctor.full_name,
              phone: doctor.phone || '',
              role: 'doctor'
            }
          })

          if (authError) {
            console.error(`❌ Failed to create auth user for ${doctor.email}:`, authError)
            continue
          }
          
          authUserId = authData.user?.id
          console.log(`✅ Created auth user for ${doctor.email}:`, authUserId)
        }

        // Update doctor with auth_user_id
        const { error: updateError } = await serviceClient
          .from('doctors')
          .update({ 
            auth_user_id: authUserId,
            updated_at: new Date().toISOString()
          })
          .eq('id', doctor.id)

        if (updateError) {
          console.error(`❌ Failed to update doctor ${doctor.email}:`, updateError)
          // If we created a new auth user and update failed, clean it up
          if (authUserId) {
            await serviceClient.auth.admin.deleteUser(authUserId)
          }
          continue
        }

        console.log(`✅ Fixed doctor: ${doctor.email}`)
        fixedCount++
      } catch (error) {
        console.error(`❌ Error fixing doctor ${doctor.email}:`, error)
      }
    }

    console.log(`🎉 Fixed ${fixedCount} out of ${doctorsToFix.length} doctors`)
    return { success: true, fixed: fixedCount }
  } catch (error) {
    console.error('❌ Fix approved doctors error:', error)
    return { success: false, fixed: 0, error: 'Failed to fix approved doctors' }
  }
}