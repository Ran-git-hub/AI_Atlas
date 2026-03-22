-- Public read access for AI_Atlas_Use_Cases (matches typical anon read for a public catalog).
-- Apply in Supabase: SQL Editor → New query → paste → Run.
-- Or: supabase db push (if linked to this project).

ALTER TABLE public."AI_Atlas_Use_Cases" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read AI_Atlas_Use_Cases" ON public."AI_Atlas_Use_Cases";

CREATE POLICY "Public read AI_Atlas_Use_Cases"
ON public."AI_Atlas_Use_Cases"
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON TABLE public."AI_Atlas_Use_Cases" TO anon, authenticated;
