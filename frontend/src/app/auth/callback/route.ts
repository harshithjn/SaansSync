import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/doctor/pending-approval'

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}${next}`)
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })

    const data = await res.json()

    if (!res.ok || !data?.access_token) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=verification_failed`)
    }

    // Set HttpOnly session cookies (BFF pattern)
    const cookieStore = await cookies()
    cookieStore.set('saanssync_access', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    if (data.refresh_token) {
      cookieStore.set('saanssync_refresh', data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
    }

    return NextResponse.redirect(`${requestUrl.origin}${next}`)
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=verification_failed`)
  }
}
