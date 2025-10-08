-- Drop all views completely and change column type
-- This is the most reliable approach

-- Step 1: Drop all views that use overall_rating (this will also drop their rules)
DROP VIEW IF EXISTS professor_course_list CASCADE;
DROP VIEW IF EXISTS professor_summary CASCADE;
DROP VIEW IF EXISTS professor_stats CASCADE;
DROP VIEW IF EXISTS recent_reviews CASCADE;

-- Step 2: Change the column type
ALTER TABLE reviews 
ALTER COLUMN overall_rating TYPE float4;

-- Step 3: Verify the change worked
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND column_name = 'overall_rating';

-- Step 4: Check if there are any remaining dependencies
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition ILIKE '%overall_rating%';
