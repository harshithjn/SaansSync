import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/doctor/pending-approval'

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=verification_failed`)
      }

      if (data.user) {
        // Check if user is a doctor
        const userRole = data.user.user_metadata?.role
        if (userRole === 'doctor') {
          return NextResponse.redirect(`${requestUrl.origin}/doctor/pending-approval`)
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=verification_failed`)
    }
  }

  // Fallback redirect
  return NextResponse.redirect(`${requestUrl.origin}${next}`)
}