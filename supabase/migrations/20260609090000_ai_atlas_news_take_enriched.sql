-- Migration: add take_enriched_at timestamp to AI_Atlas_News
-- Purpose: track which news rows have been processed by the
--          ai-news-to-atlas match-use-cases script (cron step 8).
--          Allows the script to skip already-enriched rows on subsequent runs.

alter table public."AI_Atlas_News"
  add column if not exists take_enriched_at timestamptz;

-- Index for fast lookup of un-enriched rows during cron run
create index if not exists ai_atlas_news_take_enriched_at_idx
  on public."AI_Atlas_News" (take_enriched_at)
  where take_enriched_at is null;
