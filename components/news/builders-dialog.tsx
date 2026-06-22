"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const PODCASTS = [
  { name: "Latent Space", desc: "Deep conversations with AI researchers and engineers, hosted by Swyx and Alessio.", url: "https://www.youtube.com/@LatentSpacePod" },
  { name: "Training Data", desc: "Sequoia Capital's AI podcast covering the business and technology of the AI era.", url: "https://www.youtube.com/playlist?list=PLOhHNjZItNnMm5tdW61JpnyxeYH5NDDx8" },
  { name: "No Priors", desc: "Elad Gil and Sarah Guo's unfiltered conversations with leading AI founders and researchers.", url: "https://www.youtube.com/@NoPriorsPodcast" },
  { name: "Unsupervised Learning", desc: "Redpoint Ventures' AI podcast with technical interviews and trend analysis.", url: "https://www.youtube.com/@RedpointAI" },
  { name: "The MAD Podcast with Matt Turck", desc: "Interviews with AI and data leaders hosted by FirstMark Capital's Matt Turck.", url: "https://www.youtube.com/@DataDrivenNYC" },
  { name: "AI & I by Every", desc: "Dan Shipper of Every talks with AI builders about what they're shipping.", url: "https://www.youtube.com/playlist?list=PLuMcoKK9mKgHtW_o9h5sGO2vXrffKHwJL" },
]

const BUILDERS = [
  { name: "Andrej Karpathy", desc: "Former Tesla Autopilot and OpenAI co-founder; writes about AI education, LLM internals, and ships hands-on coding projects.", url: "https://x.com/karpathy" },
  { name: "Swyx", desc: "Creator of the Latent Space podcast and the AI Engineer movement.", url: "https://x.com/swyx" },
  { name: "Josh Woodward", desc: "VP of Google Labs, shipping experimental AI products.", url: "https://x.com/joshwoodward" },
  { name: "Kevin Weil", desc: "OpenAI CPO; posts about product direction and model capabilities.", url: "https://x.com/kevinweil" },
  { name: "Peter Yang", desc: "Solo AI builder and creator of 'Behind the Craft' newsletter (140K+ readers); ex-Roblox/Reddit PM.", url: "https://x.com/petergyang" },
  { name: "Nan Yu", desc: "VP of Product at Linear; writes about AI-native product management and coding agents.", url: "https://x.com/thenanyu" },
  { name: "Madhu Guru", desc: "Technology strategist; writes about AI-native product strategy and durable vs. transient tech patterns.", url: "https://x.com/realmadhuguru" },
  { name: "Amanda Askell", desc: "Anthropic researcher working on Claude's personality, character training, and alignment.", url: "https://x.com/AmandaAskell" },
  { name: "Cat Wu", desc: "Head of Product for Claude Code at Anthropic; speaks on shipping velocity, PM-engineer merging, and AI-native teams.", url: "https://x.com/_catwu" },
  { name: "Thariq Shihipar", desc: "Engineer on Anthropic's Claude Code team; shares viral AI engineering workflows and product demos.", url: "https://x.com/trq212" },
  { name: "Google Labs", desc: "Official account for Google's experimental AI projects and early releases.", url: "https://x.com/GoogleLabs" },
  { name: "Amjad Masad", desc: "CEO of Replit; building AI-powered coding tools for the next generation of developers.", url: "https://x.com/amasad" },
  { name: "Guillermo Rauch", desc: "CEO of Vercel; building the frontend platform for the AI era.", url: "https://x.com/rauchg" },
  { name: "Alex Albert", desc: "Head of Developer Relations and Research PM at Anthropic; primary public voice for Claude API and MCP.", url: "https://x.com/alexalbert__" },
  { name: "Aaron Levie", desc: "CEO of Box; writes about enterprise AI strategy and the transformation of work.", url: "https://x.com/levie" },
  { name: "Ryo Lu", desc: "Head of Design at Cursor; advocates for designers shipping code with AI, ex-Notion/Stripe.", url: "https://x.com/ryolu_" },
  { name: "Garry Tan", desc: "CEO of Y Combinator; shares startup and AI ecosystem insights.", url: "https://x.com/garrytan" },
  { name: "Matt Turck", desc: "FirstMark Capital partner and host of The MAD Podcast on AI/ML.", url: "https://x.com/mattturck" },
  { name: "Zara Zhang", desc: "AI investor and community builder; creator of Follow Builders.", url: "https://x.com/zarazhangrui" },
  { name: "Nikunj Kothari", desc: "Partner at FPV Ventures; seed-stage AI investor, open-source contributor (Nock pitch tool).", url: "https://x.com/nikunj" },
  { name: "Peter Steinberger", desc: "Founder of PSPDFKit (acq. ~€100M), creator of OpenClaw AI agent framework, now at OpenAI leading personal agents.", url: "https://x.com/steipete" },
  { name: "Dan Shipper", desc: "CEO of Every; writes and podcasts about AI builders and their craft.", url: "https://x.com/danshipper" },
  { name: "Aditya Agarwal", desc: "Former CTO of Dropbox, early Facebook engineer, co-founder of South Park Commons; writes about AI's impact on software engineering.", url: "https://x.com/adityaag" },
  { name: "Sam Altman", desc: "CEO of OpenAI; shares company direction and AI policy views.", url: "https://x.com/sama" },
  { name: "Claude", desc: "Anthropic's official AI assistant sharing product updates and conversations.", url: "https://x.com/claudeai" },
]

const BLOGS = [
  { name: "Anthropic Engineering", desc: "Technical deep-dives on model training, safety research, and infrastructure from the Anthropic team.", url: "https://www.anthropic.com/engineering" },
  { name: "Claude Blog", desc: "Product announcements, feature updates, and use cases for Claude.", url: "https://claude.com/blog" },
]

export function BuildersButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline text-slate-400 hover:text-cyan-300 underline underline-offset-2 decoration-slate-600 hover:decoration-cyan-500/50 transition-colors"
      >
        builder channels
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-[#2f2f2f] bg-[#1c1c1c] text-[#f5f5f5] sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#f5f5f5]">
              Builder Channels
            </DialogTitle>
            <p className="text-sm text-[#8a8a8a]">
              Podcasts, AI builders on X, and official blogs tracked by{" "}
              <span className="text-cyan-300">Follow Builders</span>.
            </p>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            {/* Podcasts */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">
                Podcasts ({PODCASTS.length})
              </h3>
              <ul className="space-y-2">
                {PODCASTS.map((s) => (
                  <li key={s.name} className="text-sm">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-300 hover:underline underline-offset-2"
                    >
                      {s.name}
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                    </a>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#8a8a8a]">{s.desc}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* AI Builders on X */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">
                AI Builders on X ({BUILDERS.length})
              </h3>
              <ul className="space-y-2">
                {BUILDERS.map((s) => (
                  <li key={s.name} className="text-sm">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-300 hover:underline underline-offset-2"
                    >
                      {s.name}
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                    </a>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#8a8a8a]">{s.desc}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* Official Blogs */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">
                Official Blogs ({BLOGS.length})
              </h3>
              <ul className="space-y-2">
                {BLOGS.map((s) => (
                  <li key={s.name} className="text-sm">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-300 hover:underline underline-offset-2"
                    >
                      {s.name}
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                    </a>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#8a8a8a]">{s.desc}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
