"use client"

import { CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const dialogContentClassName =
  "max-h-[min(85vh,520px)] overflow-y-auto border-cyan-500/25 bg-slate-900/98 text-[#f5f5f5] shadow-xl sm:max-w-md [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800/70 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-500/65 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400/80"

export function AtlasQuickHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label="Help"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-slate-700/50 bg-slate-800/60 p-0 text-sm font-semibold leading-none text-white backdrop-blur-md hover:border-cyan-500/60 hover:bg-slate-700/60 lg:h-9 lg:w-auto lg:px-4"
        >
          <CircleHelp className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden lg:inline lg:ml-1.5">Help</span>
        </Button>
      </DialogTrigger>
      <DialogContent className={dialogContentClassName}>
        <DialogHeader>
          <DialogTitle className="text-[#f8fafa]">Quick help</DialogTitle>
        </DialogHeader>
        <IndexHelpBody />
      </DialogContent>
    </Dialog>
  )
}

function IndexHelpBody() {
  return (
    <ul className="list-disc space-y-2.5 pl-4 text-sm leading-relaxed text-[#d7dedb]">
      <li>
        <strong className="font-medium text-[#f0f4f1]">Industry and Country:</strong> multi-select filters;
        the menu stays open while you tick several values (use &quot;All&quot; to clear that dimension).
        Values you have picked recently are tagged <span className="whitespace-nowrap">Recent</span> inside
        each list (stored locally in this browser).
      </li>
      <li>
        <strong className="font-medium text-[#f0f4f1]">&quot;New&quot; badge:</strong> the use case was
        updated within the last 24 hours (same rule as on the globe view).
      </li>
      <li>
        <strong className="font-medium text-[#f0f4f1]">Column widths:</strong> drag the grip between header
        cells to resize; double-click the grip to reset a column width (desktop).
      </li>
      <li>
        <strong className="font-medium text-[#f0f4f1]">Shareable URL:</strong> search text,
        industry/country selections, sort, visible columns, page, and page size are reflected in the address
        bar — copy the link to share the same view.
      </li>
      <li>
        <strong className="font-medium text-[#f0f4f1]">Search:</strong> matches use case title, description,
        organization name, industry, country, and city text.
      </li>
      <li>
        <strong className="font-medium text-[#f0f4f1]">Other filters:</strong> open{" "}
        <span className="whitespace-nowrap">Other Filters</span> for city, organization, and updated date
        range.
      </li>
      <li>
        <strong className="font-medium text-[#f0f4f1]">Details:</strong> click a row or the green underlined
        title to open the full detail panel; green links open sources in a new tab.
      </li>
      <li>
        <strong className="font-medium text-[#f0f4f1]">Table density:</strong>{" "}
        <span className="whitespace-nowrap">Compact</span> fits more rows on screen (especially on phones);{" "}
        <span className="whitespace-nowrap">Comfortable</span> adds spacing and, on larger screens, shows an
        extra subtitle line per row.
      </li>
    </ul>
  )
}
