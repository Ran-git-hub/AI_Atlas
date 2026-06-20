// Admin session token helpers.
// Uses Web Crypto API (Edge-runtime compatible) with HMAC-SHA256.
// The signing key is derived from SUPABASE_SERVICE_ROLE_KEY.

const ALGORITHM: HmacImportParams = { name: "HMAC", hash: "SHA-256" }
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function secretKeyRaw(): Uint8Array {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!raw) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  }
  return new TextEncoder().encode(raw.slice(0, 64))
}

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    secretKeyRaw(),
    ALGORITHM,
    false,
    ["sign", "verify"],
  )
}

function base64UrlEncode(data: Uint8Array | ArrayBuffer): string {
  const arr = data instanceof Uint8Array ? data : new Uint8Array(data)
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function base64UrlDecode(str: string): ArrayBuffer {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/")
  while (b64.length % 4) b64 += "="
  const raw = atob(b64)
  const buf = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i)
  return buf.buffer
}

export async function signAdminToken(username: string): Promise<string> {
  const exp = Date.now() + TOKEN_TTL_MS
  const payload = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ username, exp })),
  )
  const key = await importKey()
  const sig = await crypto.subtle.sign(
    ALGORITHM,
    key,
    new TextEncoder().encode(payload),
  )
  return `${payload}.${base64UrlEncode(sig)}`
}

export async function verifyAdminToken(
  token: string,
): Promise<string | null> {
  try {
    const dot = token.lastIndexOf(".")
    if (dot < 0) return null
    const payload = token.slice(0, dot)
    const sig = base64UrlDecode(token.slice(dot + 1))

    const key = await importKey()
    const valid = await crypto.subtle.verify(
      ALGORITHM,
      key,
      sig,
      new TextEncoder().encode(payload),
    )
    if (!valid) return null

    const data = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payload)),
    ) as { username: string; exp: number }
    if (!data.exp || !data.username) return null
    if (Date.now() > data.exp) return null
    return data.username
  } catch {
    return null
  }
}
