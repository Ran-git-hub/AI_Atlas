"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function parseIsoDateLocal(iso: string): Date | undefined {
  if (!iso) return undefined
  const parts = iso.split("-").map((v) => Number(v))
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return undefined
  const [y, m, d] = parts
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return undefined
  return date
}

function formatIsoFromDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

interface AdvancedFilterDateFieldProps {
  value: string
  onChange: (next: string) => void
  emptyLabel: string
  desktopWidthClass?: string
}

export function AdvancedFilterDateField({
  value,
  onChange,
  emptyLabel,
  desktopWidthClass = "md:w-[150px] md:max-w-[150px]",
}: AdvancedFilterDateFieldProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parseIsoDateLocal(value)

  return (
    <div className="min-w-0 w-full md:w-auto">
      <div className="md:hidden">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-9 w-full min-w-0 justify-between gap-2 rounded-full border-slate-700/50 bg-slate-800/60 px-3 font-normal text-white hover:border-cyan-500/60 hover:bg-slate-700/60",
                !value && "text-[#8a8a8a]",
              )}
            >
              <span className="min-w-0 truncate text-left">
                {selected ? selected.toLocaleDateString() : emptyLabel}
              </span>
              <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="dark w-auto border border-cyan-500/25 bg-slate-900/95 p-0 text-[#f5f5f5] shadow-lg backdrop-blur-md"
          >
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(date) => {
                if (date) {
                  onChange(formatIsoFromDate(date))
                  setOpen(false)
                }
              }}
              defaultMonth={selected}
              autoFocus
              className="rounded-md"
            />
            {value ? (
              <div className="border-t border-slate-700/50 p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full text-xs text-[#8a8a8a] hover:bg-slate-800 hover:text-white"
                  onClick={() => {
                    onChange("")
                    setOpen(false)
                  }}
                >
                  Clear date
                </Button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>
      <div className="hidden md:block md:min-w-0">
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "block h-9 w-full min-w-0 max-w-full rounded-full border-slate-700/50 bg-slate-800/60 text-white",
            desktopWidthClass,
            "[&::-webkit-calendar-picker-indicator]:ml-0 [&::-webkit-calendar-picker-indicator]:shrink-0",
          )}
        />
      </div>
    </div>
  )
}
