"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const SOURCES = [
  { name: "The Batch (DeepLearning.AI)", desc: "Weekly AI newsletter curated by Andrew Ng's team, covering the latest papers and industry trends.", url: "https://www.deeplearning.ai/the-batch" },
  { name: "The Decoder", desc: "German-based outlet reporting on AI policy, open-source models, and EU tech regulation.", url: "https://the-decoder.com/" },
  { name: "VentureBeat AI", desc: "Daily AI industry coverage with a focus on enterprise adoption and startup funding.", url: "https://venturebeat.com/category/ai/" },
  { name: "AI News", desc: "Aggregator of breaking AI stories from mainstream tech media and research blogs.", url: "https://ainews.com/" },
  { name: "MIT Technology Review AI", desc: "In-depth long-form journalism on AI's societal impact, ethics, and research breakthroughs.", url: "https://www.technologyreview.com/topic/artificial-intelligence/" },
  { name: "Simon Willison", desc: "Independent developer and open-source advocate, known for deep dives on LLM tooling and prompt engineering.", url: "https://simonwillison.net/" },
  { name: "Hacker News (AI)", desc: "Community-curated AI links from Y Combinator's Hacker News, filtered by relevance.", url: "https://hnrss.org/newest?q=AI+OR+LLM+OR+GPT+OR+Claude+OR+Gemini" },
  { name: "Ars Technica AI", desc: "Technical deep-dives on AI hardware, software, and research from one of the oldest tech publications.", url: "https://arstechnica.com/ai/" },
  { name: "One Useful Thing (Ethan Mollick)", desc: "Wharton professor sharing practical insights on using AI for work, creativity, and education.", url: "https://www.oneusefulthing.org/?sort=new" },
  { name: "TLDR Tech", desc: "Daily tech newsletter summarizing the most important stories in AI, crypto, and software engineering.", url: "https://tldr.tech/" },
]

export function NewsSourcesButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline text-slate-400 hover:text-cyan-300 underline underline-offset-2 decoration-slate-600 hover:decoration-cyan-500/50 transition-colors"
      >
        leading media
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-[#2f2f2f] bg-[#1c1c1c] text-[#f5f5f5] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#f5f5f5]">
              News Sources
            </DialogTitle>
            <p className="text-sm text-[#8a8a8a]">
              AI Atlas curates updates from these 10 sources.
            </p>
          </DialogHeader>
          <ol className="mt-3 space-y-3">
            {SOURCES.map((source, i) => (
              <li key={source.name} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-xs font-medium text-[#8a8a8a] tabular-nums">
                  {i + 1}.
                </span>
                <div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-300 hover:underline underline-offset-2"
                  >
                    {source.name}
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                  </a>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#8a8a8a]">{source.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  )
}
