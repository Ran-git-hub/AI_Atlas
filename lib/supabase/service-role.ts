import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client using the service role key. Bypasses RLS so reads succeed
 * even before policies exist on a table. Never import this from client components.
 *
 * Set SUPABASE_SERVICE_ROLE_KEY in .env.local (Dashboard → Project Settings → API → service_role).
 */
function isHttpHeaderSafeAscii(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c > 127) return false
  }
  return true
}

export function createServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  if (!isHttpHeaderSafeAscii(key)) {
    console.warn(
      "[supabase] SUPABASE_SERVICE_ROLE_KEY must be ASCII (the real JWT from the dashboard). Non-ASCII placeholders break HTTP headers; using anon client instead."
    )
    return null
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
