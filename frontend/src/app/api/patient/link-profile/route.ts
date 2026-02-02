import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { phone, userId } = await request.json()

    if (!phone || !userId) {
      return NextResponse.json({ error: 'Phone and User ID are required' }, { status: 400 })
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '')

    // 1. Find the patient by phone (bypass RLS)
    const { data: patient, error: fetchError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('phone', cleanPhone)
      .single()

    if (fetchError || !patient) {
      console.error('Patient lookup failed:', fetchError)
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
    }

    // 2. Link the auth user to the patient profile
    const { data: updatedPatient, error: updateError } = await supabaseAdmin
      .from('patients')
      .update({ auth_user_id: userId })
      .eq('id', patient.id)
      .select()
      .single()

    if (updateError) {
      console.error('Link profile failed:', updateError)
      return NextResponse.json({ error: 'Failed to link profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      patient: updatedPatient
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
