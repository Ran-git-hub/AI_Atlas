# 🌍 AI Atlas

**AI Atlas** tracks real-world AI deployments across industries and countries — updated daily by an automated agent pipeline.

🔗 **Live:** https://v0-ai-atlas.vercel.app 

---

## What It Does

AI Atlas collects, structures, and displays verified AI use cases from 110+ sources daily. It is not a curated list — it is a living database maintained by an agentic workflow that runs every day.

- **Daily updates:** Automated agent runs in OpenClaw pipeline adds new cases each day
- **Two views:** Interactive 3D globe and a filterable index table
- **Weekly blog:** AI deployment trends and insights generated from the week's data

---

## Why I Built This

This project started as a personal curiosity: I wanted to see where AI was actually being deployed in the real world, not just in headlines. It became a hands-on learning ground for agentic AI systems — building, breaking, and rebuilding the data pipeline taught me more about AI agents than any course could.

The frontend was vibe-coded using [v0 by Vercel](https://v0.dev) and [Cursor](https://cursor.sh/). The data pipeline runs on [OpenClaw](https://github.com/openclaw) with harness engineering principles — structured skill files, pre/post-run hooks, subagent responsibility splitting, and a weekly human-in-the-loop review cycle.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Radix UI |
| Database | Supabase (PostgreSQL) |
| Globe | Three.js / WebGL |
| Agent Pipeline | OpenClaw, Claude |
| Deployment | Vercel |

---

## Project Structure
/app              # Next.js App Router pages and layouts
/components       # Reusable UI components
/lib              # Supabase client and utility functions
/hooks            # Custom React hooks
/data             # Static data and config
/supabase/migrations  # PostgreSQL schema migrations
/scripts          # Data pipeline scripts

---

## Data Pipeline

The agent pipeline runs daily and follows a 4-layer architecture:

1. **Collection** — Queries 110+ sources using a search fallback chain (Tavily → Exa → fallback search tools)
2. **Quality gate** — Validates records against structured rules in `ai-atlas-data-quality/SKILL.md`
3. **Deduplication** — Merges duplicates and resolves missing company references
4. **Publishing** — Approved records are written to Supabase and surfaced in the app

A weekly human-in-the-loop review cycle catches quality issues that automated rules cannot detect.

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
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Apply database migrations
npx supabase link --project-ref your-project-ref
npx supabase db pull

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## License

MIT
