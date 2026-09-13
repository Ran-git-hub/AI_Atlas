-- Fix Supabase security lint: function_search_path_mutable (3 findings)
-- Pinned search_path to prevent schema injection attacks.
-- Manually applied 2026-09-13 via Supabase Dashboard SQL Editor
-- (Supabase MCP was read-only, rejected DDL with ERROR 25006).

ALTER FUNCTION public.autonomous_ingest_v2 SET search_path = public, pg_temp;
ALTER FUNCTION public.ai_atlas_blog_posts_touch_updated SET search_path = public, pg_temp;
ALTER FUNCTION public.ai_atlas_announcements_touch_updated SET search_path = public, pg_temp;
