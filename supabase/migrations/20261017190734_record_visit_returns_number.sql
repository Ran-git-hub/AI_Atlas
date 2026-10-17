-- Record a visit and return the visitor's number: their place among all
-- browsers ever recorded, ordered by first visit. The globe shows it as
-- "You're visitor #N" (plus the pre-record estimate, added in /api/visit).
CREATE FUNCTION ai_atlas_record_visit(p_visitor_id uuid, p_path text, p_country text)
RETURNS bigint
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_first timestamptz;
BEGIN
  INSERT INTO "AI_Atlas_Visits" (visitor_id, first_path, country)
  VALUES (p_visitor_id, p_path, p_country)
  ON CONFLICT (visitor_id, day) DO NOTHING;

  SELECT min(created_at) INTO v_first FROM "AI_Atlas_Visits" WHERE visitor_id = p_visitor_id;

  RETURN (
    SELECT count(*) FROM (
      SELECT visitor_id, min(created_at) AS first_at
      FROM "AI_Atlas_Visits"
      GROUP BY visitor_id
    ) f
    WHERE (f.first_at, f.visitor_id) <= (v_first, p_visitor_id)
  );
END
$$;
REVOKE EXECUTE ON FUNCTION ai_atlas_record_visit(uuid, text, text) FROM PUBLIC, anon, authenticated;
