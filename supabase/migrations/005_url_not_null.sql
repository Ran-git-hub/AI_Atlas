-- Migration: Fix autonomous_ingest_v2 function with correct column names
-- Date: 2026-04-13
-- AI_Atlas_Companies columns: id, name, description, industry, website_url, logo_url, headquarters_country, created_at, city, latitude, longitude, last_ingested_at
-- AI_Atlas_Use_Cases columns: id, company_id, type, title, summary, content, industry, continent, country, city, latitude, longitude, published_at, status, is_trending, source_name, confidence_score, created_at, URL

CREATE OR REPLACE FUNCTION autonomous_ingest_v2(
  p_company_name TEXT,
  p_website TEXT,
  p_industry TEXT,
  p_country TEXT,
  p_city TEXT,
  p_continent TEXT,
  p_case_type TEXT,
  p_case_title TEXT,
  p_case_content TEXT,
  p_case_lat FLOAT,
  p_case_lng FLOAT,
  p_url TEXT DEFAULT NULL,
  p_source_name TEXT DEFAULT NULL
) RETURNS TABLE(final_case_id UUID) AS $$
DECLARE
  v_company_id UUID;
  v_case_id UUID;
BEGIN
  IF p_company_name IS NULL OR p_company_name = '' THEN
    RAISE EXCEPTION 'Company name is required';
  END IF;
  
  IF p_case_title IS NULL OR p_case_title = '' THEN
    RAISE EXCEPTION 'Case title is required';
  END IF;
  
  IF p_case_content IS NULL OR LENGTH(p_case_content) < 100 THEN
    RAISE EXCEPTION 'Case content must be at least 100 characters';
  END IF;
  
  IF p_url IS NULL OR p_url = '' THEN
    RAISE EXCEPTION 'URL is required';
  END IF;
  
  IF p_source_name IS NULL OR p_source_name = '' THEN
    RAISE EXCEPTION 'source_name is required';
  END IF;

  -- Find company by name
  SELECT id INTO v_company_id FROM "AI_Atlas_Companies" 
  WHERE LOWER(name) = LOWER(p_company_name) LIMIT 1;
  
  -- Create company if not exists
  IF v_company_id IS NULL THEN
    INSERT INTO "AI_Atlas_Companies" (name, website_url, industry, headquarters_country, city, created_at)
    VALUES (p_company_name, p_website, p_industry, p_country, p_city, NOW())
    RETURNING id INTO v_company_id;
  END IF;

  -- Insert use case
  INSERT INTO "AI_Atlas_Use_Cases" (
    company_id, type, title, summary, content, industry, continent, country, city,
    latitude, longitude, published_at, status, source_name, confidence_score, created_at, URL
  ) VALUES (
    v_company_id, p_case_type, p_case_title, LEFT(p_case_content, 200), p_case_content,
    p_industry, p_continent, p_country, p_city,
    p_case_lat, p_case_lng, NOW(), 'published', p_source_name, 0.8, NOW(), p_url
  ) RETURNING id INTO v_case_id;

  RETURN QUERY SELECT v_case_id;
END;
$$ LANGUAGE plpgsql;
