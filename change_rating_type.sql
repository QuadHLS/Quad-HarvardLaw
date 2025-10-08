-- Step 1: Drop the views that are blocking the column change
DROP VIEW IF EXISTS professor_summary CASCADE;
DROP VIEW IF EXISTS professor_stats CASCADE;
DROP VIEW IF EXISTS recent_reviews CASCADE;

-- Step 2: Change the column type from integer to float4
ALTER TABLE reviews 
ALTER COLUMN overall_rating TYPE float4;

-- Step 3: Verify the change worked
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND column_name = 'overall_rating';

-- Step 4: You'll need to recreate your views
-- Get the full definitions from your database and add them here
-- Example:
-- CREATE VIEW professor_summary AS 
-- SELECT professor_name, AVG(overall_rating) as avg_rating, COUNT(*) as review_count
-- FROM reviews 
-- GROUP BY professor_name;
