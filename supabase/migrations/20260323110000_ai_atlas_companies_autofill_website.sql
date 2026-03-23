-- Autofill AI_Atlas_Companies.website_url from trusted, existing URLs
-- in AI_Atlas_Use_Cases (not from guessed company-name domains).

create or replace function public.ai_atlas_normalize_url(url text)
returns text
language plpgsql
as $$
begin
  if url is null or btrim(url) = '' then
    return null;
  end if;

  if btrim(url) ~* '^https?://' then
    return btrim(url);
  end if;

  return 'https://' || btrim(url);
end;
$$;

create or replace function public.ai_atlas_extract_hostname(url text)
returns text
language sql
immutable
as $$
  select lower(
    regexp_replace(
      regexp_replace(public.ai_atlas_normalize_url(url), '^https?://', '', 'i'),
      '/.*$',
      ''
    )
  );
$$;

create or replace function public.ai_atlas_is_non_official_host(host text)
returns boolean
language sql
immutable
as $$
  select host like '%linkedin.com%'
      or host like '%x.com%'
      or host like '%twitter.com%'
      or host like '%facebook.com%'
      or host like '%instagram.com%'
      or host like '%youtube.com%'
      or host like '%tiktok.com%'
      or host like '%wikipedia.org%'
      or host like '%github.com%';
$$;

create or replace function public.ai_atlas_infer_company_website(company_row_id text)
returns text
language sql
stable
as $$
  with candidates as (
    select public.ai_atlas_normalize_url(uc.website_url) as source_url
    from public."AI_Atlas_Use_Cases" uc
    where uc.company_id::text = company_row_id
      and uc.website_url is not null
      and btrim(uc.website_url) <> ''
    union all
    select public.ai_atlas_normalize_url(uc.url) as source_url
    from public."AI_Atlas_Use_Cases" uc
    where uc.company_id::text = company_row_id
      and uc.url is not null
      and btrim(uc.url) <> ''
    union all
    select public.ai_atlas_normalize_url(uc.reference_url) as source_url
    from public."AI_Atlas_Use_Cases" uc
    where uc.company_id::text = company_row_id
      and uc.reference_url is not null
      and btrim(uc.reference_url) <> ''
  ),
  hosts as (
    select
      source_url,
      public.ai_atlas_extract_hostname(source_url) as host
    from candidates
  ),
  filtered as (
    select source_url, host
    from hosts
    where host is not null
      and host <> ''
      and not public.ai_atlas_is_non_official_host(host)
  ),
  ranked as (
    select
      ('https://' || host) as root_url,
      count(*) as freq
    from filtered
    group by host
    order by freq desc, length(host) asc
    limit 1
  )
  select root_url from ranked;
$$;

create or replace function public.ai_atlas_companies_autofill_website_from_use_cases()
returns trigger
language plpgsql
as $$
begin
  if new.website_url is null or btrim(new.website_url) = '' then
    new.website_url := public.ai_atlas_infer_company_website(new.id::text);
  elsif new.website_url !~* '^https?://' then
    new.website_url := 'https://' || btrim(new.website_url);
  else
    new.website_url := btrim(new.website_url);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_ai_atlas_companies_autofill_website on public."AI_Atlas_Companies";

create trigger trg_ai_atlas_companies_autofill_website
before insert or update of name, website_url
on public."AI_Atlas_Companies"
for each row
execute function public.ai_atlas_companies_autofill_website_from_use_cases();

-- Backfill existing rows where website_url is missing.
update public."AI_Atlas_Companies"
set website_url = public.ai_atlas_infer_company_website(id::text)
where website_url is null or btrim(website_url) = '';

-- Normalize existing rows that have URL text but no protocol.
update public."AI_Atlas_Companies"
set website_url = 'https://' || btrim(website_url)
where website_url is not null
  and btrim(website_url) <> ''
  and website_url !~* '^https?://';
