import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

async function proxyAuth(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join('/')
  const url = new URL(req.url)
  const target = `${BACKEND_URL}/auth/${path}${url.search}`

  const headers = new Headers(req.headers)
  headers.delete('cookie')

  const accessCookie = await cookies()
  const token = accessCookie.get('saanssync_access')?.value
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text()

  const res = await fetch(target, {
    method: req.method,
    headers,
    body
  })

  const contentType = res.headers.get('content-type') || 'application/json'
  const raw = await res.text()
  let data: any = raw
  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    // leave as text
  }

  const response = NextResponse.json(data, { status: res.status })
  response.headers.set('content-type', contentType)

  // On successful auth responses, set cookies
  if (data?.access_token) {
    console.log(`✅ [Proxy] Login Successful. Setting Cookies. AccessToken Length: ${data.access_token.length}`)
    const cookieStore = await cookies()
    cookieStore.set('saanssync_access', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600 // 1 hour explicitly
    })
    if (data.refresh_token) {
      cookieStore.set('saanssync_refresh', data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400 * 30 // 30 days
      })
    }
  } else {
    console.log(`⚠️ [Proxy] No access_token found in response. Path: ${path}, Data Keys: ${data ? Object.keys(data) : 'null'}`)
  }

  if (path === 'signout') {
    console.log('👋 [Proxy] Signing out')
    const cookieStore = await cookies()
    cookieStore.set('saanssync_access', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    })
    cookieStore.set('saanssync_refresh', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    })
  }

  return response
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params
  return proxyAuth(req, params)
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params
  return proxyAuth(req, params)
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params
  return proxyAuth(req, params)
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params
  return proxyAuth(req, params)
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params
  return proxyAuth(req, params)
}
