-- The operator's own verdict on an issue derived from the weekly ops records.
-- Everything else on /admin/weekly is the writer's judgement; this is the only
-- table the admin writes.
CREATE TABLE "AI_Atlas_Weekly_Ops_Issue_State" (
  -- The derived issue key: "<source>|<location>|<normalized text>".
  issue_key text PRIMARY KEY,

  status text NOT NULL CHECK (status IN ('acked', 'done', 'ignored')),
  note text,

  -- The newest week on record when the status was set. An issue that recurs in
  -- a later week than this has come back after the operator closed it.
  status_year int NOT NULL,
  status_iso_week int NOT NULL,

  -- Denormalised copies so a row stays identifiable if the key derivation ever
  -- changes and the keys need repairing.
  source text NOT NULL,
  location text NOT NULL,
  sample_text text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Same access shape as the weekly admin table: RLS on, no policies, so anon and
-- authenticated read nothing and only service_role reaches it.
ALTER TABLE "AI_Atlas_Weekly_Ops_Issue_State" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION ai_atlas_weekly_ops_issue_state_touch_updated()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_weekly_ops_issue_state_touch_updated
  BEFORE UPDATE ON "AI_Atlas_Weekly_Ops_Issue_State"
  FOR EACH ROW EXECUTE FUNCTION ai_atlas_weekly_ops_issue_state_touch_updated();
