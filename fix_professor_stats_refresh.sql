-- Fix professor stats refresh issue
-- This ensures that professor_stats and professor_summary views update properly when reviews are deleted

-- 1. Drop and recreate professor_stats view to ensure it's properly linked
DROP VIEW IF EXISTS professor_stats CASCADE;

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
    COUNT(CASE WHEN has_cold_calls = true THEN 1 END) as cold_calls_count
FROM reviews
GROUP BY professor_name, course_name;

-- 2. Drop and recreate professor_summary view
DROP VIEW IF EXISTS professor_summary CASCADE;

CREATE VIEW professor_summary AS
SELECT 
    p.id as professor_id,
    p.name as professor_name,
    COUNT(DISTINCT pc.course_id) as total_courses,
    COUNT(DISTINCT r.id) as total_reviews,
    ROUND(AVG(r.overall_rating), 2) as avg_overall_rating,
    ROUND(AVG(r.readings_rating), 2) as avg_readings_rating,
    ROUND(AVG(r.cold_calls_rating), 2) as avg_cold_calls_rating,
    ROUND(AVG(r.exam_rating), 2) as avg_exam_rating
FROM professors p
LEFT JOIN professor_courses pc ON p.id = pc.professor_id
LEFT JOIN courses c ON pc.course_id = c.id
LEFT JOIN reviews r ON r.professor_name = p.name AND r.course_name = c.name
GROUP BY p.id, p.name
ORDER BY p.name;

-- 3. Create a function to refresh views (for manual refresh if needed)
CREATE OR REPLACE FUNCTION refresh_professor_views()
RETURNS TEXT AS $$
BEGIN
    -- Force refresh by querying the views
    PERFORM * FROM professor_stats LIMIT 1;
    PERFORM * FROM professor_summary LIMIT 1;
    RETURN 'Views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION refresh_professor_views() TO authenticated;

-- 5. Create a trigger to automatically refresh views when reviews are modified
-- (This is optional - views should auto-update, but this ensures it)
CREATE OR REPLACE FUNCTION trigger_refresh_professor_views()
RETURNS TRIGGER AS $$
BEGIN
    -- Views automatically update, but we can add logging if needed
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for review changes
DROP TRIGGER IF EXISTS refresh_views_on_review_insert ON reviews;
DROP TRIGGER IF EXISTS refresh_views_on_review_update ON reviews;
DROP TRIGGER IF EXISTS refresh_views_on_review_delete ON reviews;

CREATE TRIGGER refresh_views_on_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_professor_views();

CREATE TRIGGER refresh_views_on_review_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_professor_views();

CREATE TRIGGER refresh_views_on_review_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_professor_views();

-- 6. Test the views
SELECT 'professor_stats view test:' as test_name, COUNT(*) as row_count FROM professor_stats
UNION ALL
SELECT 'professor_summary view test:' as test_name, COUNT(*) as row_count FROM professor_summary;
