CREATE TABLE IF NOT EXISTS AI_Atlas_Weekly_Reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  related_case_ids UUID[] DEFAULT '{}',
  new_use_cases_count INTEGER DEFAULT 0,
  new_companies_count INTEGER DEFAULT 0,
  countries_count INTEGER DEFAULT 0,
  industries_count INTEGER DEFAULT 0,
  data_sources JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS weekly_reports_week_idx ON AI_Atlas_Weekly_Reports(week_start);
CREATE INDEX IF NOT EXISTS weekly_reports_published_idx ON AI_Atlas_Weekly_Reports(published_at DESC);
CREATE INDEX IF NOT EXISTS weekly_reports_tags_idx ON AI_Atlas_Weekly_Reports USING GIN(tags);
