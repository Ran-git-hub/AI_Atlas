"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!username.trim() || !password) {
      setError("Please enter both username and password.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json().catch(() => ({})) as {
        ok?: boolean
        error?: string
      }
      if (!res.ok || !data.ok) {
        setError(data.error || "Login failed")
        return
      }
      router.push("/admin")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="dark flex min-h-dvh items-center justify-center bg-[#121212] p-4"
      style={{ colorScheme: "dark" }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ai-atlas-logo.png"
            alt="AI Atlas"
            className="h-14 w-14 rounded-[14px]"
          />
          <h1 className="text-xl font-bold tracking-tight text-[#f5f5f5]">
            AI Atlas Admin
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#8a8a8a]"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="h-11 rounded-lg border-[#2f2f2f] bg-[#1c1c1c] text-[#f5f5f5] placeholder:text-[#555]"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#8a8a8a]"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-lg border-[#2f2f2f] bg-[#1c1c1c] text-[#f5f5f5] placeholder:text-[#555]"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="mt-1 h-11 w-full rounded-lg bg-[#43cc93] font-semibold text-[#0a1628] hover:bg-[#3ab883]"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  )
}
