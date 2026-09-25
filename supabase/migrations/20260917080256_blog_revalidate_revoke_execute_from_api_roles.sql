-- Take the revalidate trigger function off the public REST API.
--
-- `revoke all ... from public` in the previous migration was not enough:
-- Supabase grants EXECUTE to the `anon` and `authenticated` roles explicitly,
-- so public.ai_atlas_blog_posts_revalidate() was callable by anyone at
-- /rest/v1/rpc/ai_atlas_blog_posts_revalidate with the anon key - which ships
-- in the browser bundle. A stranger could not read the Vault secret that way,
-- but could make the database fire cache purges on demand, and every purge
-- forces a regeneration, which is the Supabase egress this caching was added
-- to avoid in the first place.
--
-- Trigger functions are invoked by the trigger machinery, which does not check
-- EXECUTE, so removing these grants does not affect the trigger.

revoke execute on function public.ai_atlas_blog_posts_revalidate() from anon, authenticated;
