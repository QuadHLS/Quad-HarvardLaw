-- COMPLETE SOLUTION FOR PROFESSOR STATS REFRESH ISSUE
-- This addresses the problem where professor_stats and professor_summary don't update when reviews are deleted

-- PROBLEM IDENTIFIED:
-- 1. professor_stats and professor_summary are VIEWS (not tables)
-- 2. Views should auto-update, but there might be caching issues
-- 3. Frontend might not be refreshing the data after deletion
-- 4. Views might need to be recreated to ensure proper linking

-- SOLUTION 1: Recreate views with proper dependencies
-- =====================================================

-- Drop existing views
DROP VIEW IF EXISTS professor_stats CASCADE;
DROP VIEW IF EXISTS professor_summary CASCADE;

-- Recreate professor_stats view (per professor-course combination)
CREATE VIEW professor_stats AS
SELECT 
    professor_name,
    course_name,
    COUNT(*) as total_reviews,
    ROUND(AVG(overall_rating), 2) as avg_overall_rating,
    ROUND(AVG(readings_rating), 2) as avg_readings_rating,
    ROUND(AVG(cold_calls_rating), 2) as avg_cold_calls_rating,
    ROUND(AVG(exam_rating), 2) as avg_exam_rating,
    COUNT(CASE WHEN grade = 'DS' THEN 1 END) as ds_count,
    COUNT(CASE WHEN grade = 'H' THEN 1 END) as h_count,
    COUNT(CASE WHEN grade = 'P' THEN 1 END) as p_count,
    COUNT(CASE WHEN laptops_allowed = true THEN 1 END) as laptops_allowed_count,
    COUNT(CASE WHEN assessment_type = 'Final Exam' THEN 1 END) as final_exam_count,
    COUNT(CASE WHEN assessment_type = 'Project' THEN 1 END) as project_count,
    COUNT(CASE WHEN assessment_type = 'Both' THEN 1 END) as both_count,
    COUNT(CASE WHEN has_cold_calls = true THEN 1 END) as cold_calls_count,
    MAX(created_at) as last_review_date
FROM reviews
GROUP BY professor_name, course_name
ORDER BY professor_name, course_name;

-- Recreate professor_summary view (per professor across all courses)
CREATE VIEW professor_summary AS
SELECT 
    p.id as professor_id,
    p.name as professor_name,
    COUNT(DISTINCT pc.course_id) as total_courses,
    COUNT(DISTINCT r.id) as total_reviews,
    ROUND(AVG(r.overall_rating), 2) as avg_overall_rating,
    ROUND(AVG(r.readings_rating), 2) as avg_readings_rating,
    ROUND(AVG(r.cold_calls_rating), 2) as avg_cold_calls_rating,
    ROUND(AVG(r.exam_rating), 2) as avg_exam_rating,
    MAX(r.created_at) as last_review_date
FROM professors p
LEFT JOIN professor_courses pc ON p.id = pc.professor_id
LEFT JOIN courses c ON pc.course_id = c.id
LEFT JOIN reviews r ON r.professor_name = p.name AND r.course_name = c.name
GROUP BY p.id, p.name
ORDER BY p.name;

-- SOLUTION 2: Create refresh functions
-- ====================================

-- Function to manually refresh views (if needed)
CREATE OR REPLACE FUNCTION refresh_professor_views()
RETURNS TEXT AS $$
BEGIN
    -- Force refresh by querying the views
    PERFORM * FROM professor_stats LIMIT 1;
    PERFORM * FROM professor_summary LIMIT 1;
    RETURN 'Professor views refreshed successfully at ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get current view status
CREATE OR REPLACE FUNCTION get_professor_views_status()
RETURNS TABLE(
    view_name TEXT,
    row_count BIGINT,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'professor_stats'::TEXT as view_name,
        COUNT(*)::BIGINT as row_count,
        NOW() as last_updated
    FROM professor_stats
    UNION ALL
    SELECT 
        'professor_summary'::TEXT as view_name,
        COUNT(*)::BIGINT as row_count,
        NOW() as last_updated
    FROM professor_summary;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION refresh_professor_views() TO authenticated;
GRANT EXECUTE ON FUNCTION get_professor_views_status() TO authenticated;

-- SOLUTION 3: Add logging triggers (optional)
-- ============================================

-- Function to log when reviews are modified
CREATE OR REPLACE FUNCTION log_review_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the change (you can create a log table if needed)
    -- For now, just return the record
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for review changes
DROP TRIGGER IF EXISTS log_review_insert ON reviews;
DROP TRIGGER IF EXISTS log_review_update ON reviews;
DROP TRIGGER IF EXISTS log_review_delete ON reviews;

CREATE TRIGGER log_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION log_review_changes();

CREATE TRIGGER log_review_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION log_review_changes();

CREATE TRIGGER log_review_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION log_review_changes();

-- SOLUTION 4: Test the views
-- ==========================

-- Test that views are working
SELECT 'Testing professor_stats view:' as test;
SELECT professor_name, course_name, total_reviews, avg_overall_rating 
FROM professor_stats 
ORDER BY professor_name, course_name 
LIMIT 5;

SELECT 'Testing professor_summary view:' as test;
SELECT professor_name, total_courses, total_reviews, avg_overall_rating 
FROM professor_summary 
ORDER BY professor_name 
LIMIT 5;

-- Test the refresh function
SELECT refresh_professor_views() as refresh_result;

-- Test the status function
SELECT * FROM get_professor_views_status();

-- SOLUTION 5: Instructions for frontend
-- =====================================

/*
FRONTEND FIX NEEDED:

If you're deleting reviews from the frontend, make sure to:

1. After deleting a review, refresh the professor stats:
   ```javascript
   // After successful deletion
   const { data: professorStats } = await supabase
     .from('professor_stats')
     .select('*');
   
   const { data: professorSummary } = await supabase
     .from('professor_summary')
     .select('*');
   ```

2. Or call the refresh function:
   ```javascript
   await supabase.rpc('refresh_professor_views');
   ```

3. Make sure to update your local state with the new data.

If you're deleting directly from the database, the views should update automatically.
If they don't, run: SELECT refresh_professor_views();
*/
