-- Complete fix for overall_rating column type change
-- This handles both views AND rules that depend on the column

-- Step 1: Drop all rules that depend on the overall_rating column
DROP RULE IF EXISTS _RETURN ON professor_stats_disabled CASCADE;
DROP RULE IF EXISTS _RETURN ON professor_summary_disabled CASCADE;
DROP RULE IF EXISTS _RETURN ON professor_course_list_disabled CASCADE;
DROP RULE IF EXISTS _RETURN ON recent_reviews_disabled CASCADE;

-- Step 2: Drop any other rules on the reviews table that might use overall_rating
DROP RULE IF EXISTS review_rating_rule ON reviews CASCADE;

-- Step 3: Now try to change the column type
ALTER TABLE reviews 
ALTER COLUMN overall_rating TYPE float4;

-- Step 4: Verify the change worked
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND column_name = 'overall_rating';

-- Step 5: When ready to restore, you'll need to recreate the views
-- (The rules will be automatically recreated when you recreate the views)
