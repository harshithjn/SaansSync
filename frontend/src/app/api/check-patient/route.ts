import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
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

    // Check if patient exists using Service Role (bypasses RLS)
    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .select('id, full_name, phone')
      .eq('phone', cleanPhone)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!patient) {
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ 
      exists: true, 
      patient: {
        id: patient.id,
        full_name: patient.full_name,
        phone: patient.phone
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
