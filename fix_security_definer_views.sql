-- FIX SECURITY DEFINER VIEWS
-- This script specifically addresses the remaining Security Definer View issues

-- ==============================================
-- Drop and recreate all views WITHOUT SECURITY DEFINER
-- ==============================================

-- 1. Fix recent_reviews view
DROP VIEW IF EXISTS recent_reviews CASCADE;

CREATE VIEW recent_reviews AS
SELECT 
    r.id,
    r.user_id,
    r.professor_name,
    r.course_name,
    r.semester,
    r.year,
    r.grade,
    r.overall_rating,
    r.readings_rating,
    r.cold_calls_rating,
    r.exam_rating,
    r.overall_review,
    r.readings_review,
    r.cold_calls_review,
    r.exam_review,
    r.laptops_allowed,
    r.assessment_type,
    r.has_cold_calls,
    r.helpful_count,
    r.not_helpful_count,
    r.created_at,
    r.updated_at
FROM reviews r
ORDER BY r.created_at DESC;

-- 2. Fix professor_stats view
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

-- 3. Fix professor_summary view
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
    ROUND(AVG(r.exam_rating), 2) as avg_exam_rating,
    COUNT(CASE WHEN r.grade = 'DS' THEN 1 END) as ds_count,
    COUNT(CASE WHEN r.grade = 'H' THEN 1 END) as h_count,
    COUNT(CASE WHEN r.grade = 'P' THEN 1 END) as p_count
FROM professors p
LEFT JOIN professor_courses pc ON p.id = pc.professor_id
LEFT JOIN reviews r ON p.name = r.professor_name
GROUP BY p.id, p.name
ORDER BY p.name;

-- 4. Fix professor_course_list view
DROP VIEW IF EXISTS professor_course_list CASCADE;

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
-- Grant proper permissions
-- ==============================================

GRANT SELECT ON recent_reviews TO anon, authenticated;
GRANT SELECT ON professor_stats TO anon, authenticated;
GRANT SELECT ON professor_summary TO anon, authenticated;
GRANT SELECT ON professor_course_list TO anon, authenticated;

-- ==============================================
-- Verification
-- ==============================================

-- Test that all views work
SELECT 'Testing all views:' as test;
SELECT COUNT(*) as recent_reviews_count FROM recent_reviews;
SELECT COUNT(*) as professor_stats_count FROM professor_stats;
SELECT COUNT(*) as professor_summary_count FROM professor_summary;
SELECT COUNT(*) as professor_course_list_count FROM professor_course_list;

-- Check that views are not SECURITY DEFINER
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('recent_reviews', 'professor_stats', 'professor_summary', 'professor_course_list')
ORDER BY viewname;
