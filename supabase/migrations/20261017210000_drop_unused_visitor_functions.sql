-- The public site no longer shows a visitor count or number, so the footer
-- count and the record-and-number functions have no callers. Visits are
-- recorded by /api/visit directly; /admin/visitors reads ai_atlas_visitor_stats().
DROP FUNCTION ai_atlas_visitor_count();
DROP FUNCTION ai_atlas_record_visit(uuid, text, text);
