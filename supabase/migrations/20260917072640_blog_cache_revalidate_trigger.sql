-- Purge the `blog` cache tag whenever a blog post is written.
--
-- Why: /blog reads a cached list (unstable_cache "blog-posts-v1", tagged
-- `blog`, 24h) and the route itself is ISR-cached for 24h. Blog posts are
-- written straight into this table - by an agent, by the SQL editor, by hand -
-- so they never pass through the app and nothing calls revalidateTag. The
-- index then keeps serving a snapshot from before the post existed, while the
-- post's own /blog/[slug] page works fine, which makes the symptom confusing:
-- reachable by URL, present in the sitemap, missing from the index. Observed
-- 2026-09-16 with ai-industry-notes-2026-09-03-to-2026-09-16, and the two
-- hostnames were a day apart from each other because the rendered HTML is
-- cached per edge region.
--
-- This moves the purge off the writer's memory and onto the write itself.
--
-- Prerequisite, NOT in this file because it carries the secret: a Vault entry
-- named `revalidate_secret` holding the same value as the REVALIDATE_SECRET
-- env var in Vercel. Until it exists this trigger is a no-op: the function
-- finds no secret, skips the call, and the write proceeds normally.

create extension if not exists pg_net;

create or replace function public.ai_atlas_blog_posts_revalidate()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_secret text;
begin
  -- Never let a cache purge break a publish: any failure below is swallowed.
  begin
    select decrypted_secret into v_secret
      from vault.decrypted_secrets
     where name = 'revalidate_secret'
     limit 1;

    if v_secret is null or v_secret = '' then
      raise notice 'ai_atlas_blog_posts_revalidate: no revalidate_secret in vault, skipping';
      return null;
    end if;

    -- Fire-and-forget. pg_net queues the request and returns immediately, so
    -- this adds no latency to the write and cannot roll it back. The response
    -- lands in net._http_response if you need to check whether it worked.
    perform net.http_post(
      url     := 'https://ai-atlas.app/api/revalidate',
      body    := jsonb_build_object('tags', jsonb_build_array('blog')),
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Bearer ' || v_secret
                 )
    );
  exception when others then
    raise notice 'ai_atlas_blog_posts_revalidate failed: %', sqlerrm;
  end;

  return null;
end;
$$;

revoke all on function public.ai_atlas_blog_posts_revalidate() from public;

-- Statement-level, so publishing ten posts in one statement purges once rather
-- than ten times. DELETE is included because removing a post has to leave the
-- index too.
drop trigger if exists trg_ai_atlas_blog_posts_revalidate on public."AI_Atlas_Blog_Posts";

create trigger trg_ai_atlas_blog_posts_revalidate
after insert or update or delete on public."AI_Atlas_Blog_Posts"
for each statement
execute function public.ai_atlas_blog_posts_revalidate();
