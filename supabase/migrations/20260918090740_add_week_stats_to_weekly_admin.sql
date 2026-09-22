-- The week's pipeline volume: how much was ingested and how it was dispositioned.
-- Shape: { "useCaseStatusBreakdown": {total, published, pending, archived},
--          "companyStatusBreakdown": {total, published, pending, archived} }
--
-- The ops writer computed these already but had nowhere to put them once the
-- public post (which carried them in content.overview) stopped being written.
-- Nullable like the other payload columns: NULL means the writer did not write it.
ALTER TABLE "AI_Atlas_Weekly_Reports_Admin" ADD COLUMN week_stats jsonb;
