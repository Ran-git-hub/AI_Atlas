-- First-party visitor record. Vercel Web Analytics cannot report a lifetime
-- unique-visitor count, so the site writes one row per browser per day here.
-- visitor_id is a random UUID kept in the visitor's localStorage: no IP, no
-- cookie, no personal data.
CREATE TABLE "AI_Atlas_Visits" (
  visitor_id uuid NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  first_path text NOT NULL,
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visitor_id, day)
);

CREATE INDEX idx_visits_day ON "AI_Atlas_Visits" (day DESC);

-- RLS on with no policies: only service_role (the /api/visit route) can touch it.
ALTER TABLE "AI_Atlas_Visits" ENABLE ROW LEVEL SECURITY;

-- Distinct browsers ever recorded, for the footer count (/api/visitors).
CREATE FUNCTION ai_atlas_visitor_count() RETURNS bigint
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT count(DISTINCT visitor_id) FROM "AI_Atlas_Visits"
$$;
REVOKE EXECUTE ON FUNCTION ai_atlas_visitor_count() FROM PUBLIC, anon, authenticated;

-- Everything /admin/visitors shows, in one round trip. Days are UTC.
-- today/daily count visitor-days; last7/last30/countries count distinct browsers.
CREATE FUNCTION ai_atlas_visitor_stats() RETURNS jsonb
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH t AS (SELECT (now() AT TIME ZONE 'UTC')::date AS today)
  SELECT jsonb_build_object(
    'total', (SELECT count(DISTINCT visitor_id) FROM "AI_Atlas_Visits"),
    'firstDay', (SELECT min(day) FROM "AI_Atlas_Visits"),
    'today', (SELECT count(*) FROM "AI_Atlas_Visits", t WHERE day = t.today),
    'last7', (SELECT count(DISTINCT visitor_id) FROM "AI_Atlas_Visits", t WHERE day > t.today - 7),
    'last30', (SELECT count(DISTINCT visitor_id) FROM "AI_Atlas_Visits", t WHERE day > t.today - 30),
    'daily', (
      SELECT jsonb_agg(jsonb_build_object('day', d.day, 'visitors', coalesce(v.n, 0)) ORDER BY d.day)
      FROM t
      CROSS JOIN LATERAL generate_series(t.today - 29, t.today, interval '1 day') AS g(ts)
      CROSS JOIN LATERAL (SELECT g.ts::date AS day) d
      LEFT JOIN (SELECT day, count(*) AS n FROM "AI_Atlas_Visits" GROUP BY day) v ON v.day = d.day
    ),
    'countries', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('country', c.country, 'visitors', c.n) ORDER BY c.n DESC, c.country), '[]'::jsonb)
      FROM (
        SELECT country, count(DISTINCT visitor_id) AS n
        FROM "AI_Atlas_Visits", t
        WHERE day > t.today - 30
        GROUP BY country
      ) c
    )
  )
$$;
REVOKE EXECUTE ON FUNCTION ai_atlas_visitor_stats() FROM PUBLIC, anon, authenticated;
