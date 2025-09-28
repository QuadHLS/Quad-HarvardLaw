-- COMPLETE SECURITY FIX
-- This script aggressively removes all problematic views and recreates them cleanly

-- ==============================================
-- STEP 1: Completely remove all views and dependencies
-- ==============================================

-- Drop all views with CASCADE to remove any dependencies
DROP VIEW IF EXISTS recent_reviews CASCADE;
DROP VIEW IF EXISTS professor_stats CASCADE;
DROP VIEW IF EXISTS professor_summary CASCADE;
DROP VIEW IF EXISTS professor_course_list CASCADE;

-- ==============================================
-- STEP 2: Recreate views as simple SELECT statements (no SECURITY DEFINER)
-- ==============================================

-- 1. recent_reviews view - simple and clean
CREATE VIEW recent_reviews AS
SELECT 
    id,
    user_id,
    professor_name,
    course_name,
    semester,
    year,
    grade,
    overall_rating,
    readings_rating,
    cold_calls_rating,
    exam_rating,
    overall_review,
    readings_review,
    cold_calls_review,
    exam_review,
    laptops_allowed,
    assessment_type,
    has_cold_calls,
    helpful_count,
    not_helpful_count,
    created_at,
    updated_at
FROM reviews
ORDER BY created_at DESC;

-- 2. professor_stats view - simple aggregation
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

-- 3. professor_summary view - simple aggregation
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
    COUNT(CASE WHEN r.grade = 'DS' THEN 1 END) as ds_count,
    COUNT(CASE WHEN r.grade = 'H' THEN 1 END) as h_count,
    COUNT(CASE WHEN r.grade = 'P' THEN 1 END) as p_count
FROM professors p
LEFT JOIN professor_courses pc ON p.id = pc.professor_id
LEFT JOIN reviews r ON p.name = r.professor_name
GROUP BY p.id, p.name
ORDER BY p.name;

-- 4. professor_course_list view - simple join
CREATE VIEW professor_course_list AS
SELECT 
    p.id as professor_id,
    p.name as professor_name,
    c.id as course_id,
    c.name as course_name,
    pc.created_at as assignment_date
FROM professors p
JOIN professor_courses pc ON p.id = pc.professor_id
JOIN courses c ON pc.course_id = c.id
ORDER BY p.name, c.name;

-- ==============================================
-- STEP 3: Grant permissions
-- ==============================================

GRANT SELECT ON recent_reviews TO anon, authenticated;
GRANT SELECT ON professor_stats TO anon, authenticated;
GRANT SELECT ON professor_summary TO anon, authenticated;
GRANT SELECT ON professor_course_list TO anon, authenticated;

-- ==============================================
-- STEP 4: Verify the views are clean
-- ==============================================

-- Check view definitions
SELECT 
    schemaname,
    viewname,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN 'HAS SECURITY DEFINER'
        ELSE 'CLEAN'
    END as security_status
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('recent_reviews', 'professor_stats', 'professor_summary', 'professor_course_list')
ORDER BY viewname;

-- Test that views work
SELECT 'View Test Results:' as test_type;
SELECT 'recent_reviews' as view_name, COUNT(*) as row_count FROM recent_reviews
UNION ALL
SELECT 'professor_stats' as view_name, COUNT(*) as row_count FROM professor_stats
UNION ALL
SELECT 'professor_summary' as view_name, COUNT(*) as row_count FROM professor_summary
UNION ALL
SELECT 'professor_course_list' as view_name, COUNT(*) as row_count FROM professor_course_list;
