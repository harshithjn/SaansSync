import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

async function proxy(req: NextRequest, params: { path: string[] }) {
  const url = new URL(req.url)
  const target = `${BACKEND_URL}${url.pathname}${url.search}`

  console.log('[PROXY] Incoming request:', {
    method: req.method,
    pathname: url.pathname,
    target,
    hasToken: !!await cookies().then(c => c.get('saanssync_access')?.value)
  })

  const cookieStore = await cookies()
  const token = cookieStore.get('saanssync_access')?.value

  if (!token) {
    console.log('[PROXY] No token found, returning 401')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const headers = new Headers(req.headers)
  headers.delete('cookie')
  headers.set('Authorization', `Bearer ${token}`)

  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text()

  try {
    console.log('[PROXY] Forwarding to backend:', target)
    const res = await fetch(target, {
      method: req.method,
      headers,
      body
    })

    console.log('[PROXY] Backend response:', {
      status: res.status,
      statusText: res.statusText
    })

    const contentType = res.headers.get('content-type') || 'application/json'
    const raw = await res.text()
    const response = new NextResponse(raw, { status: res.status })
    response.headers.set('content-type', contentType)
    return response
  } catch (error) {
    console.error('[PROXY] Error:', error)
    return NextResponse.json({ error: 'Proxy Request Failed', details: String(error) }, { status: 502 })
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params
  return proxy(req, params)
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params
  return proxy(req, params)
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params
  return proxy(req, params)
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params
  return proxy(req, params)
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params
  return proxy(req, params)
}
