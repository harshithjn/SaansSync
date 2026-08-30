export type ApiResponse<T> = T

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '')
const API_BASE = `${API_ORIGIN}/api`
const AUTH_BASE = `${API_ORIGIN}/auth`

async function parseJsonSafely(response: Response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  let token = '';
  try {
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('saanssync_token') || '';
    }
  } catch(e) {}

  const headers = { ...init?.headers } as any;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
  })

  const data = await parseJsonSafely(res)

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || res.statusText
    throw new Error(message)
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(API_BASE, path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(API_BASE, path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }),
  put: <T>(path: string, body?: unknown) => request<T>(API_BASE, path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }),
  patch: <T>(path: string, body?: unknown) => request<T>(API_BASE, path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }),
  delete: <T>(path: string) => request<T>(API_BASE, path, { method: 'DELETE' })
}

export const authApi = {
  get: <T>(path: string) => request<T>(AUTH_BASE, path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(AUTH_BASE, path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
}

export default api
