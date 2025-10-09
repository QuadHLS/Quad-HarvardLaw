-- Fix Security Definer View Issues
-- This script recreates all views with SECURITY INVOKER to fix security concerns

-- Step 1: Drop existing views that have security definer issues
DROP VIEW IF EXISTS professor_summary CASCADE;
DROP VIEW IF EXISTS professor_stats CASCADE;
DROP VIEW IF EXISTS professor_course_list CASCADE;
DROP VIEW IF EXISTS recent_reviews CASCADE;

-- Step 2: Recreate views with SECURITY INVOKER (default behavior, but explicit for clarity)

-- 1. Professor Summary View - Shows average ratings and review counts per professor
CREATE VIEW professor_summary 
WITH (security_invoker = true) AS
SELECT 
    professor_name,
    ROUND(AVG(overall_rating)::numeric, 1) as avg_rating,
    COUNT(*) as review_count,
    ROUND(AVG(CASE WHEN laptops_allowed = true THEN 1.0 ELSE 0.0 END)::numeric, 1) as laptops_allowed_percentage,
    ROUND(AVG(CASE WHEN has_cold_calls = true THEN 1.0 ELSE 0.0 END)::numeric, 1) as cold_calls_percentage
FROM reviews 
GROUP BY professor_name
ORDER BY avg_rating DESC;

-- 2. Professor Stats View - More detailed statistics per professor
CREATE VIEW professor_stats 
WITH (security_invoker = true) AS
SELECT 
    professor_name,
    ROUND(AVG(overall_rating)::numeric, 1) as avg_rating,
    COUNT(*) as total_reviews,
    COUNT(CASE WHEN overall_rating >= 8.0 THEN 1 END) as high_rating_reviews,
    COUNT(CASE WHEN overall_rating <= 4.0 THEN 1 END) as low_rating_reviews,
    ROUND(AVG(CASE WHEN laptops_allowed = true THEN 1.0 ELSE 0.0 END)::numeric, 1) as laptops_allowed_avg,
    ROUND(AVG(CASE WHEN has_cold_calls = true THEN 1.0 ELSE 0.0 END)::numeric, 1) as cold_calls_avg,
    COUNT(DISTINCT course_name) as courses_taught
FROM reviews 
GROUP BY professor_name
ORDER BY avg_rating DESC;

-- 3. Recent Reviews View - Shows the most recent reviews
CREATE VIEW recent_reviews 
WITH (security_invoker = true) AS
SELECT 
    professor_name,
    course_name,
    overall_rating,
    overall_review,
    laptops_allowed,
    has_cold_calls,
    assessment_type,
    created_at
FROM reviews 
ORDER BY created_at DESC
LIMIT 50;

-- 4. Professor Course List View - Shows courses taught by each professor
-- This view needs to be updated to match your current schema
CREATE VIEW professor_course_list 
WITH (security_invoker = true) AS
SELECT 
    professor_name,
    course_name,
    ROUND(AVG(overall_rating)::numeric, 1) as avg_rating,
    COUNT(*) as review_count,
    MAX(created_at) as last_review_date
FROM reviews 
GROUP BY professor_name, course_name
ORDER BY professor_name, avg_rating DESC;

-- Step 3: Grant appropriate permissions to authenticated users
GRANT SELECT ON professor_summary TO authenticated;
GRANT SELECT ON professor_stats TO authenticated;
GRANT SELECT ON recent_reviews TO authenticated;
GRANT SELECT ON professor_course_list TO authenticated;

-- Step 4: Verify the views were created successfully and check their security settings
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('professor_summary', 'professor_stats', 'recent_reviews', 'professor_course_list');

-- Step 5: Check that views are now using SECURITY INVOKER
SELECT 
    n.nspname as schema_name,
    c.relname as view_name,
    CASE 
        WHEN c.reloptions IS NULL THEN 'SECURITY INVOKER (default)'
        WHEN 'security_invoker=true' = ANY(c.reloptions) THEN 'SECURITY INVOKER'
        WHEN 'security_invoker=false' = ANY(c.reloptions) THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER (default)'
    END as security_type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v' 
AND n.nspname = 'public'
AND c.relname IN ('professor_summary', 'professor_stats', 'recent_reviews', 'professor_course_list');
