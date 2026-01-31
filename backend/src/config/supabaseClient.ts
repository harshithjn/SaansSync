import 'dotenv/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!supabaseUrl) {
  console.warn('SUPABASE_URL not configured')
}

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, { 
      auth: { 
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      } 
    })
  : null

export const supabaseAdmin: SupabaseClient | null = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, { 
      auth: { 
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      } 
    })
  : null

export function requireAdminClient(): SupabaseClient {
  if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  return supabaseAdmin
}

export function requireClient(): SupabaseClient {
  if (!supabase) throw new Error('SUPABASE_ANON_KEY is not configured')
  return supabase
}

export default {
  supabase,
  supabaseAdmin,
  requireAdminClient,
  requireClient
}
