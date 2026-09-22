import Link from "next/link"
import { ArrowLeft } from "lucide-react"

/** The same return link on every admin sub-page, so they all leave the same way. */
export function BackToAdminPanel({ className }: { className?: string }) {
  return (
    <Link
      href="/admin"
      className={`inline-flex shrink-0 items-center gap-1.5 text-xs text-[#8a8a8a] transition-colors hover:text-[#f5f5f5] ${className ?? ""}`}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to admin panel
    </Link>
  )
}
