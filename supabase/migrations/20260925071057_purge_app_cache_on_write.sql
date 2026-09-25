-- Purge the app's data caches whenever the tables behind them change.
--
-- The app caches every public read for 24 hours and drops a cache only when a
-- write passes through its own admin routes. The daily pipeline and the agents
-- write to these tables directly, so their changes stayed invisible until
-- someone remembered to call /api/revalidate - and on 2026-09-24 five cases
-- reverted to pending stayed public for a day because nobody did.
--
-- A statement-level trigger records which cache tags a write dirtied; a
-- once-a-minute job sends them to /api/revalidate once the writes go quiet.
-- Waiting for a quiet minute folds a burst of single-row writes into one purge,
-- and each purge makes the next visit re-read the whole catalog. A steady
-- stream of writes is still flushed after ten minutes.
--
-- Blog posts already purge on write through trg_ai_atlas_blog_posts_revalidate
-- (2026-09-17); this extends the same idea to the other three tables and reuses
-- that trigger's Vault secret, 'revalidate_secret'.

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE SCHEMA IF NOT EXISTS cache_purge;
REVOKE ALL ON SCHEMA cache_purge FROM PUBLIC, anon, authenticated;

CREATE TABLE cache_purge.pending (
  tag text PRIMARY KEY,
  first_changed_at timestamptz NOT NULL DEFAULT now(),
  last_changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION cache_purge.mark()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  t text;
BEGIN
  -- A cache purge must never fail the write that triggered it.
  BEGIN
    FOREACH t IN ARRAY TG_ARGV LOOP
      INSERT INTO cache_purge.pending (tag) VALUES (t)
      ON CONFLICT (tag) DO UPDATE SET last_changed_at = now();
    END LOOP;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'cache_purge.mark failed: %', SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION cache_purge.flush()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  secret text;
  tags text[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cache_purge.pending
    HAVING max(last_changed_at) < now() - interval '1 minute'
        OR min(first_changed_at) < now() - interval '10 minutes'
  ) THEN
    RETURN;
  END IF;

  SELECT decrypted_secret INTO secret
  FROM vault.decrypted_secrets
  WHERE name = 'revalidate_secret';
  IF secret IS NULL THEN
    RETURN;
  END IF;

  WITH sent AS (DELETE FROM cache_purge.pending RETURNING tag)
  SELECT array_agg(tag ORDER BY tag) INTO tags FROM sent;

  PERFORM net.http_post(
    url := 'https://ai-atlas.app/api/revalidate',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || secret,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('tags', to_jsonb(tags)),
    timeout_milliseconds := 10000
  );
END;
$$;

REVOKE ALL ON FUNCTION cache_purge.mark() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION cache_purge.flush() FROM PUBLIC, anon, authenticated;

-- Tags mirror CACHE_TAGS in lib/cache-tags.ts. The catalog and the globe carry
-- company names and locations, so a company write dirties use-cases as well.
CREATE TRIGGER cache_purge_mark
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON public."AI_Atlas_Use_Cases"
FOR EACH STATEMENT EXECUTE FUNCTION cache_purge.mark('use-cases');

CREATE TRIGGER cache_purge_mark
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON public."AI_Atlas_Companies"
FOR EACH STATEMENT EXECUTE FUNCTION cache_purge.mark('companies', 'use-cases');

CREATE TRIGGER cache_purge_mark
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON public."AI_Atlas_News"
FOR EACH STATEMENT EXECUTE FUNCTION cache_purge.mark('news');

SELECT cron.schedule('ai-atlas-cache-purge', '* * * * *', 'SELECT cache_purge.flush()');

-- pg_cron logs every run; at one a minute that is 1440 rows a day.
SELECT cron.schedule(
  'ai-atlas-cache-purge-log-cleanup',
  '17 3 * * *',
  $$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '3 days'$$
);
