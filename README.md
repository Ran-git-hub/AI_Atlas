# 🌍 AI Atlas

**AI Atlas** tracks real-world AI deployments across industries and countries — updated daily by an automated agent pipeline.

🔗 **Live:** https://v0-ai-atlas.vercel.app 

markdown# 🌍 AI Atlas

> Daily updates on real-world AI deployments worldwide.

**AI Atlas** is a living database of real-world AI deployments — automatically collected, structured, and published every day by an agentic pipeline. It tracks how organizations across industries and countries are actually using AI, not just talking about it.

⭐ **Built by:** A non-developer using AI-assisted tools — v0, Cursor, and Claude

---


<img width="1156" height="1126" alt="截屏2026-04-18 20 56 42" src="https://github.com/user-attachments/assets/bff12a8a-090b-464e-9cbc-73e47a103254" />

---

## What Makes This Different

Most AI tracking projects are manually curated lists that go stale. AI Atlas runs a daily agentic pipeline that:

- Queries across industries and geographies
- Validates, deduplicates, and structures each record automatically
- Publishes new cases to the live app every day

As of April 2026: **667 use cases · 477 organizations · 47 countries · 65 industries**

---

## Features

### 🌐 Interactive Globe View
Explore AI deployments on a 3D globe. Each marker represents a real organization deploying AI. Rotate, zoom, and click to explore.

### 📊 Index View
A fully filterable and searchable table of all use cases. Filter by industry, country, or keyword. Sort by date to see the latest deployments first.

### 🔍 Search & Filter
Full-text search across use case titles, descriptions, and organizations. Filter by industry and country simultaneously.

---

## Data Pipeline Architecture

The pipeline runs daily and follows a 4-layer process:
Layer 1: Collection
└── 10-12 targeted queries/day
└── Search fallback chain: Tavily → Exa MCP → xcrawl-search → DuckDuckGo
└── Geographic rotation to ensure global coverage
Layer 2: Quality Gate
└── Validates against rules in ai-atlas-data-quality/SKILL.md
└── Minimum content length enforcement
└── Source credibility check
Layer 3: Deduplication & Enrichment
└── Merges duplicate records
└── Resolves missing company references
└── Links to existing organizations in database
Layer 4: Publishing
└── Approved records written to Supabase
└── Live app updated automatically
└── Weekly blog generated from accumulated data

**Human-in-the-loop:** A weekly review cycle catches quality issues that automated rules cannot detect — misclassified content, hallucinated records, and borderline cases.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS, shadcn/ui, Radix UI |
| Database | Supabase (PostgreSQL) |
| Globe | Three.js / WebGL |
| Agent Pipeline | OpenClaw, Claude |
| Deployment | Vercel |
| Development | Cursor, v0 by Vercel |

---

## Project Structure
/app                    # Next.js App Router pages and layouts
/components             # Reusable UI components
/lib                    # Supabase client and utility functions
/hooks                  # Custom React hooks
/data                   # Static data and config
/supabase/migrations    # PostgreSQL schema migrations
/scripts                # Data pipeline scripts

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18.17+
- [pnpm](https://pnpm.io/installation)
- A [Supabase](https://supabase.com/) project

### Local Setup

```bash
# Clone the repo
git clone https://github.com/Ran-git-hub/AI_Atlas.git
cd AI_Atlas

# Install dependencies
pnpm install

# Configure environment variables
# Create .env.local and add your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Apply database migrations
npx supabase link --project-ref your-project-ref
npx supabase db pull

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Background Reading

If you're interested in how this was built:

- [Harness Engineering for AI Agents](https://www.linkedin.com/in/YOUR_PROFILE) — How I restructured the pipeline using SKILL files, memory, and failure reflex loops
- [AI Atlas Weekly Blog](https://v0-ai-nine-gules.vercel.app/blog) — Weekly reports generated from the pipeline

---

## Data Sources & Disclaimer

Data is sourced from company websites, public announcements, and industry reports. Locations, categories, and links are best-effort and may contain inaccuracies. Information is provided for reference only — please verify with official sources.

Company names, logos, and trademarks belong to their respective owners.

---

## License

MIT
