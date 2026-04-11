-- Blog / weekly reports (public read via anon; writes via service_role only).
-- Apply in Supabase SQL Editor or supabase db push.

CREATE TABLE IF NOT EXISTS public."AI_Atlas_Blog_Posts" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_kind TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  related_case_ids UUID[] NOT NULL DEFAULT '{}',
  week_start DATE,
  week_end DATE,
  new_use_cases_count INTEGER NOT NULL DEFAULT 0,
  new_companies_count INTEGER NOT NULL DEFAULT 0,
  countries_count INTEGER NOT NULL DEFAULT 0,
  industries_count INTEGER NOT NULL DEFAULT 0,
  data_sources JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_atlas_blog_posts_kind_chk
    CHECK (post_kind IN ('weekly_report', 'article')),
  CONSTRAINT ai_atlas_blog_posts_weekly_dates_chk
    CHECK (
      (post_kind = 'weekly_report' AND week_start IS NOT NULL AND week_end IS NOT NULL)
      OR (post_kind = 'article' AND week_start IS NULL AND week_end IS NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_atlas_blog_posts_slug_uidx
  ON public."AI_Atlas_Blog_Posts" (slug);

CREATE UNIQUE INDEX IF NOT EXISTS ai_atlas_blog_posts_weekly_week_start_uidx
  ON public."AI_Atlas_Blog_Posts" (week_start)
  WHERE post_kind = 'weekly_report';

CREATE INDEX IF NOT EXISTS ai_atlas_blog_posts_published_idx
  ON public."AI_Atlas_Blog_Posts" (published_at DESC);

CREATE INDEX IF NOT EXISTS ai_atlas_blog_posts_kind_idx
  ON public."AI_Atlas_Blog_Posts" (post_kind);

CREATE INDEX IF NOT EXISTS ai_atlas_blog_posts_tags_idx
  ON public."AI_Atlas_Blog_Posts" USING GIN (tags);

ALTER TABLE public."AI_Atlas_Blog_Posts" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read AI_Atlas_Blog_Posts" ON public."AI_Atlas_Blog_Posts";

CREATE POLICY "Public read AI_Atlas_Blog_Posts"
  ON public."AI_Atlas_Blog_Posts"
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON TABLE public."AI_Atlas_Blog_Posts" TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.ai_atlas_blog_posts_touch_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_atlas_blog_posts_touch_updated ON public."AI_Atlas_Blog_Posts";

CREATE TRIGGER trg_ai_atlas_blog_posts_touch_updated
  BEFORE UPDATE ON public."AI_Atlas_Blog_Posts"
  FOR EACH ROW
  EXECUTE PROCEDURE public.ai_atlas_blog_posts_touch_updated();
