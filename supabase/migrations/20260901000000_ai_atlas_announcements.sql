-- Site-wide announcement (single row, id = 1).
-- Public read via anon; writes via service_role only.
-- Apply in Supabase SQL Editor.

-- Clean up any hand-created table (empty, safe to drop), including a partial
-- AI_Atlas_Announcements that exists without the content column.
DROP TABLE IF EXISTS public."AI_Atlas_Annoucement";
DROP TABLE IF EXISTS public."AI_Atlas_Announcement";
DROP TABLE IF EXISTS public."AI_Atlas_Announcements";

CREATE TABLE public."AI_Atlas_Announcements" (
  id INTEGER PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_atlas_announcements_single_row_chk CHECK (id = 1)
);

INSERT INTO public."AI_Atlas_Announcements" (id, content)
VALUES (1, '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public."AI_Atlas_Announcements" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read AI_Atlas_Announcements" ON public."AI_Atlas_Announcements";

CREATE POLICY "Public read AI_Atlas_Announcements"
  ON public."AI_Atlas_Announcements"
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON TABLE public."AI_Atlas_Announcements" TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.ai_atlas_announcements_touch_updated()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_atlas_announcements_touch_updated ON public."AI_Atlas_Announcements";

CREATE TRIGGER trg_ai_atlas_announcements_touch_updated
  BEFORE UPDATE ON public."AI_Atlas_Announcements"
  FOR EACH ROW EXECUTE PROCEDURE public.ai_atlas_announcements_touch_updated();
