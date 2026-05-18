# AI Atlas

AI Atlas is a public web app for exploring real-world AI deployments across companies, industries, and countries.

The app combines an interactive globe, a searchable use case index, industry pages, and a blog/weekly report system backed by Supabase.

Live app: https://v0-ai-atlas.vercel.app

## What It Tracks

AI Atlas focuses on deployed or announced AI use cases, not general AI news. Each record is intended to describe:

- the organization using or building the system
- the industry or sector involved
- the country, city, or deployment location
- the source URL or reference material
- the use case description and related metadata

Data is collected and structured by an automated research pipeline, then published to the app for browsing and analysis.

## Main Features

### Interactive Globe

The home page shows companies and use cases on a 3D globe. Users can search, filter, select map markers, and open detail panels for individual organizations or deployments.

### Use Case Index

The `/use-cases` page provides a searchable and filterable table of all tracked deployments. It supports keyword search, industry filters, country filters, sorting, pagination, column visibility, and detail modals.

### Industry Explorer

The `/industries` pages group use cases by industry and summarize activity by company, country, recent deployments, and related weekly reports.

### Blog And Weekly Reports

The `/blog` pages render analysis posts and generated weekly reports from Supabase. Weekly reports include highlights, trends, related case IDs, tags, and summary statistics.

## Tech Stack

| Layer | Technology |
| --- | --- |
| App framework | Next.js App Router |
| Language | TypeScript |
| UI | React, Tailwind CSS, shadcn/ui, Radix UI |
| Globe | Three.js, react-globe.gl |
| Tables | TanStack Table |
| Database | Supabase Postgres |
| Local report storage | SQLite via better-sqlite3 |
| Deployment | Vercel |

## Project Structure

```text
app/                    Next.js routes, layouts, pages, and API handlers
components/             Reusable UI and feature components
components/globe/       Interactive globe implementation
components/use-cases/   Use case table and detail modal components
components/blog/        Blog article and list components
components/industries/  Industry summary and detail components
lib/                    Data access, Supabase clients, types, utilities
hooks/                  Shared React hooks
scripts/                Maintenance and content generation scripts
supabase/migrations/    Database migrations and policies
data/                   Local SQLite weekly report database
```

## Core Routes

| Route | Purpose |
| --- | --- |
| `/` | Globe-based exploration experience |
| `/use-cases` | Full use case index |
| `/use-cases/[id]` | Shareable use case detail page |
| `/industries` | Industry summary index |
| `/industries/[industry]` | Industry detail page |
| `/blog` | Blog and weekly report index |
| `/blog/[slug]` | Blog post or weekly report detail |
| `/api/use-cases/[id]` | JSON endpoint for a single normalized use case |

## Data Model

The app primarily reads from these Supabase tables:

- `AI_Atlas_Companies`
- `AI_Atlas_Use_Cases`
- `AI_Atlas_Blog_Posts`

The data layer is implemented in:

- `lib/data.ts` for companies, use cases, coordinates, and latest update timestamps
- `lib/data-blog.ts` for blog and weekly report reads
- `lib/data-industries.ts` for industry aggregation
- `lib/blog-admin.ts` for weekly report upserts

Server-side reads prefer `SUPABASE_SERVICE_ROLE_KEY` when available so the app can read data even when row-level security policies are incomplete. Public browser code only uses the anon key.

## Prerequisites

- Node.js 18.17 or newer
- pnpm
- A Supabase project

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create `.env.local` in the repository root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` is only needed for server-side admin reads and maintenance scripts. Do not expose it in client code or commit it to git.

Run the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key used by the app |
| `SUPABASE_SERVICE_ROLE_KEY` | Recommended | Server-only key for privileged reads and maintenance scripts |
| `NEXT_DEV_LAN_ORIGINS` | Optional | Comma-separated dev origins for testing from another device on the LAN |
| `BLOG_DISABLE_WEEKLY_STUB` | Optional | Set to `true` or `1` to disable fallback weekly report stubs |

## Available Scripts

```bash
pnpm dev      # Start the Next.js dev server
pnpm build    # Build the production app
pnpm start    # Start the production server
pnpm lint     # Run ESLint
```

## Weekly Report Generation

Generate a preview without saving:

```bash
npx tsx scripts/generate-weekly-report.ts --dry-run
```

Generate a report for a specific week:

```bash
npx tsx scripts/generate-weekly-report.ts --week=2026-04-04 --dry-run
```

Save or update the weekly report in Supabase:

```bash
npx tsx scripts/generate-weekly-report.ts --week=2026-04-04 --save
```

The script reads published use cases for the selected week, builds highlights and trend summaries, and upserts a `weekly_report` row into `AI_Atlas_Blog_Posts`.

## Database Setup

Database migrations live in `supabase/migrations`.

Typical Supabase workflow:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Use the Supabase SQL editor if you prefer applying individual migration files manually.

## Security Notes

- `.env.local` is ignored by git and should contain all local secrets.
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.
- `/api/use-cases/[id]` is a public JSON endpoint. Only expose fields that are safe for public readers.
- Avoid committing local database files, generated reports, private paths, or machine-specific configuration unless they are intentionally part of the public project.

## Data Disclaimer

AI Atlas data is compiled from public sources such as company websites, announcements, public reports, and related materials. Records are best-effort and may contain incomplete or outdated information. Verify important details against original sources before relying on them.

Company names, logos, and trademarks belong to their respective owners.

## License

MIT
