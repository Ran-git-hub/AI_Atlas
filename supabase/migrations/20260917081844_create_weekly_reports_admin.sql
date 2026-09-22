-- Admin-only weekly report operations record.
-- Keyed on the ISO week, not on the public blog post: the public weekly report is
-- changing form and may pause, but the ops record keeps running every week.
CREATE TABLE "AI_Atlas_Weekly_Reports_Admin" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  year int NOT NULL,
  iso_week int NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  slug text,

  -- Optional link to the public post for that week, when one exists.
  blog_post_id uuid REFERENCES "AI_Atlas_Blog_Posts"(id) ON DELETE SET NULL,

  -- The eight operations fields the weekly writer produces.
  -- Nullable on purpose: NULL means the writer did not write it, which is
  -- distinguishable from an empty result.
  system_health jsonb,
  agent_metrics jsonb,
  observations jsonb,
  search_strategy jsonb,
  search_tool_usage jsonb,
  data_quality jsonb,
  next_steps jsonb,
  carry_over jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT weekly_reports_admin_week_unique UNIQUE (year, iso_week)
);

CREATE INDEX idx_weekly_admin_week ON "AI_Atlas_Weekly_Reports_Admin" (year DESC, iso_week DESC);
CREATE INDEX idx_weekly_admin_blog_post_id ON "AI_Atlas_Weekly_Reports_Admin" (blog_post_id);

-- RLS on with no policies: anon and authenticated get zero rows.
-- Only service_role (which bypasses RLS) can read or write.
ALTER TABLE "AI_Atlas_Weekly_Reports_Admin" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION ai_atlas_weekly_reports_admin_touch_updated()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_weekly_reports_admin_touch_updated
  BEFORE UPDATE ON "AI_Atlas_Weekly_Reports_Admin"
  FOR EACH ROW EXECUTE FUNCTION ai_atlas_weekly_reports_admin_touch_updated();
