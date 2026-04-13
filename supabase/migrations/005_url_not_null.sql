-- Migration: Add URL NOT NULL constraint to AI_Atlas_Use_Cases
-- Date: 2026-04-13
-- Purpose: Ensure every use case has a source URL to prevent bad data from search snippets

-- Step 1: Ensure no NULL URLs exist (safety check)
DELETE FROM AI_Atlas_Use_Cases WHERE URL IS NULL OR URL = '';

-- Step 2: Add NOT NULL constraint to URL column
ALTER TABLE AI_Atlas_Use_Cases ALTER COLUMN URL SET NOT NULL;

-- Step 3: Add NOT NULL constraint to source_name column (source is also required)
ALTER TABLE AI_Atlas_Use_Cases ALTER COLUMN source_name SET NOT NULL;

-- Step 4: Update autonomous_ingest_v2 function to validate URL before insert
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
  -- Validate required fields
  IF p_company_name IS NULL OR p_company_name = '' THEN
    RAISE EXCEPTION 'Company name is required';
  END IF;
  
  IF p_case_title IS NULL OR p_case_title = '' THEN
    RAISE EXCEPTION 'Case title is required';
  END IF;
  
  IF p_case_content IS NULL OR LENGTH(p_case_content) < 100 THEN
    RAISE EXCEPTION 'Case content must be at least 100 characters';
  END IF;
  
  -- URL validation: must not be null or empty
  IF p_url IS NULL OR p_url = '' THEN
    RAISE EXCEPTION 'URL is required — search snippets cannot be used as content. A valid source URL must be provided.';
  END IF;
  
  IF p_source_name IS NULL OR p_source_name = '' THEN
    RAISE EXCEPTION 'source_name is required — please provide the original article or press release source name.';
  END IF;

  -- Find or create company
  SELECT id INTO v_company_id FROM AI_Atlas_Companies 
  WHERE LOWER(name) = LOWER(p_company_name) LIMIT 1;
  
  IF v_company_id IS NULL THEN
    INSERT INTO AI_Atlas_Companies (name, website, industry, headquarters_country, city, continent)
    VALUES (p_company_name, p_website, p_industry, p_country, p_city, p_continent)
    RETURNING id INTO v_company_id;
  END IF;

  -- Insert use case
  INSERT INTO AI_Atlas_Use_Cases (
    company_id, title, URL, source_name, country, city, continent,
    latitude, longitude, industry, type, content, status, confidence_score
  ) VALUES (
    v_company_id, p_case_title, p_url, p_source_name, p_country, p_city, p_continent,
    p_case_lat, p_case_lng, p_industry, p_case_type, p_case_content, 'published', 0.8
  ) RETURNING id INTO v_case_id;

  RETURN QUERY SELECT v_case_id;
END;
$$ LANGUAGE plpgsql;
