import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** Cookie names must be ByteString-safe; non-ASCII names break fetch Headers. */
function cookieNameIsSafe(name: string): boolean {
  if (!name) return false
  for (let i = 0; i < name.length; i++) {
    if (name.charCodeAt(i) > 127) return false
  }
  return true
}

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().filter((c) => cookieNameIsSafe(c.name))
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (!cookieNameIsSafe(name)) return
              cookieStore.set(name, value, options)
            })
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}
