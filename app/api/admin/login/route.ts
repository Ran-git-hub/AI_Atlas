import { NextResponse } from "next/server"
import { signAdminToken } from "@/lib/admin-auth"

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export async function POST(request: Request) {
  const expectedUser = process.env.ADMIN_USERNAME
  const expectedPass = process.env.ADMIN_PASSWORD
  if (!expectedUser || !expectedPass) {
    return NextResponse.json(
      { ok: false, error: "Server not configured" },
      { status: 500 },
    )
  }

  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    )
  }

  const username = String(body.username ?? "").trim()
  const password = String(body.password ?? "")

  if (
    !constantTimeEqual(username, expectedUser) ||
    !constantTimeEqual(password, expectedPass)
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid credentials" },
      { status: 401 },
    )
  }

  const token = await signAdminToken(username)
  const res = NextResponse.json({ ok: true })
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  })
  return res
}
