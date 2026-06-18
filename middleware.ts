import { NextResponse, type NextRequest } from "next/server"

const REALM = "AI Atlas Admin"

function isAuthorized(request: NextRequest): boolean {
  const expectedUser = process.env.ADMIN_USERNAME
  const expectedPass = process.env.ADMIN_PASSWORD
  // Fail closed if the env vars are not configured.
  if (!expectedUser || !expectedPass) return false

  const header = request.headers.get("authorization") ?? ""
  if (!header.startsWith("Basic ")) return false

  let decoded: string
  try {
    decoded = atob(header.slice(6))
  } catch {
    return false
  }

  const idx = decoded.indexOf(":")
  if (idx < 0) return false
  const user = decoded.slice(0, idx)
  const pass = decoded.slice(idx + 1)

  return (
    constantTimeEqual(user, expectedUser) &&
    constantTimeEqual(pass, expectedPass)
  )
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
    },
  })
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Gate /admin/* (any method).
  if (pathname.startsWith("/admin")) {
    return isAuthorized(request) ? NextResponse.next() : unauthorized()
  }

  // Gate only mutating calls on /api/use-cases/* — GET stays public.
  if (pathname.startsWith("/api/use-cases") && request.method === "PATCH") {
    return isAuthorized(request) ? NextResponse.next() : unauthorized()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/use-cases/:path*"],
}
