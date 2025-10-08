-- Drop existing views first, then recreate with proper rounding

-- Step 1: Drop existing views
DROP VIEW IF EXISTS professor_summary CASCADE;
DROP VIEW IF EXISTS professor_stats CASCADE;
DROP VIEW IF EXISTS professor_course_list CASCADE;
DROP VIEW IF EXISTS recent_reviews CASCADE;

-- Step 2: Recreate views with proper rounding (using ::numeric cast)

-- 1. Professor Summary View - Shows average ratings and review counts per professor
CREATE VIEW professor_summary AS
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
CREATE VIEW professor_stats AS
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
CREATE VIEW recent_reviews AS
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
CREATE VIEW professor_course_list AS
SELECT 
    professor_name,
    course_name,
    ROUND(AVG(overall_rating)::numeric, 1) as avg_rating,
    COUNT(*) as review_count,
    MAX(created_at) as last_review_date
FROM reviews 
GROUP BY professor_name, course_name
ORDER BY professor_name, avg_rating DESC;

-- Step 3: Verify the views were created successfully
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('professor_summary', 'professor_stats', 'recent_reviews', 'professor_course_list');
