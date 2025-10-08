-- Temporarily disable views by renaming them (easier to restore later)

-- Step 1: Rename the views to disable them
ALTER VIEW professor_course_list RENAME TO professor_course_list_disabled;
ALTER VIEW professor_summary RENAME TO professor_summary_disabled;
ALTER VIEW professor_stats RENAME TO professor_stats_disabled;
ALTER VIEW recent_reviews RENAME TO recent_reviews_disabled;

-- Step 2: Change the column type
ALTER TABLE reviews 
ALTER COLUMN overall_rating TYPE float4;

-- Step 3: Verify the change worked
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND column_name = 'overall_rating';

-- Step 4: When you're ready to restore the views, just rename them back:
-- ALTER VIEW professor_course_list_disabled RENAME TO professor_course_list;
-- ALTER VIEW professor_summary_disabled RENAME TO professor_summary;
-- ALTER VIEW professor_stats_disabled RENAME TO professor_stats;
-- ALTER VIEW recent_reviews_disabled RENAME TO recent_reviews;
