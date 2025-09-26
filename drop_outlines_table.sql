-- Drop outlines table and related objects

-- Drop the view first (if it exists)
DROP VIEW IF EXISTS outlines_with_stats;

-- Drop the trigger (only the outlines-specific one)
DROP TRIGGER IF EXISTS update_outlines_updated_at ON outlines;

-- Drop the table (this will also drop all indexes and policies)
-- Note: We don't drop the update_updated_at_column() function because 
-- it's used by other tables like profiles
DROP TABLE IF EXISTS outlines;
