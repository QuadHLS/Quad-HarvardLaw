-- DEBUG SECURITY DEFINER ISSUES
-- This script helps us understand why Supabase is still detecting Security Definer Views

-- ==============================================
-- Check if views actually have SECURITY DEFINER
-- ==============================================

-- Check view definitions for SECURITY DEFINER
SELECT 
    schemaname,
    viewname,
    definition,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN 'HAS SECURITY DEFINER'
        ELSE 'NO SECURITY DEFINER'
    END as security_status
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('recent_reviews', 'professor_stats', 'professor_summary', 'professor_course_list')
ORDER BY viewname;

-- ==============================================
-- Check for any functions that might be related
-- ==============================================

-- Check for functions that might be affecting these views
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (
    pg_get_functiondef(p.oid) LIKE '%professor_stats%' OR
    pg_get_functiondef(p.oid) LIKE '%professor_summary%' OR
    pg_get_functiondef(p.oid) LIKE '%recent_reviews%' OR
    pg_get_functiondef(p.oid) LIKE '%professor_course_list%'
);

-- ==============================================
-- Check for any triggers on these views
-- ==============================================

-- Check for triggers
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('recent_reviews', 'professor_stats', 'professor_summary', 'professor_course_list');

-- ==============================================
-- Alternative approach: Try to recreate views with explicit security settings
-- ==============================================

-- Drop all views completely
DROP VIEW IF EXISTS recent_reviews CASCADE;
DROP VIEW IF EXISTS professor_stats CASCADE;
DROP VIEW IF EXISTS professor_summary CASCADE;
DROP VIEW IF EXISTS professor_course_list CASCADE;

-- Recreate with explicit SECURITY INVOKER (opposite of SECURITY DEFINER)
CREATE VIEW recent_reviews WITH (security_invoker = true) AS
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

CREATE VIEW professor_stats WITH (security_invoker = true) AS
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

CREATE VIEW professor_summary WITH (security_invoker = true) AS
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

CREATE VIEW professor_course_list WITH (security_invoker = true) AS
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
-- Grant permissions
-- ==============================================

GRANT SELECT ON recent_reviews TO anon, authenticated;
GRANT SELECT ON professor_stats TO anon, authenticated;
GRANT SELECT ON professor_summary TO anon, authenticated;
GRANT SELECT ON professor_course_list TO anon, authenticated;

-- ==============================================
-- Final verification
-- ==============================================

-- Check the final state
SELECT 
    schemaname,
    viewname,
    definition,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN 'HAS SECURITY DEFINER'
        WHEN definition LIKE '%security_invoker%' THEN 'EXPLICIT SECURITY INVOKER'
        ELSE 'DEFAULT SECURITY'
    END as security_status
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('recent_reviews', 'professor_stats', 'professor_summary', 'professor_course_list')
ORDER BY viewname;
