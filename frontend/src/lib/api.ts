// Frontend API client (BFF only)

export type ApiResponse<T> = T

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

async function parseJsonSafely(response: Response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let token = '';
  try {
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('saanssync_token') || '';
    }
  } catch(e) {}

  const headers = { ...init?.headers } as any;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (res.status === 401 && typeof window !== 'undefined' && (window as any).Clerk) {
    // Optional: handle auth failure
  }

  const data = await parseJsonSafely(res)

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || res.statusText
    throw new Error(message)
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }),
  put: <T>(path: string, body?: unknown) => request<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
}

export default api
