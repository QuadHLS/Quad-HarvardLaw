-- SUPABASE SECURITY FIXES
-- This script addresses all the security issues found by Supabase Security Advisor

-- ==============================================
-- 1. CRITICAL: Fix Exposed Auth Users Issue
-- ==============================================

-- Drop the problematic recent_reviews view that exposes auth.users data
DROP VIEW IF EXISTS recent_reviews CASCADE;

-- Recreate recent_reviews view WITHOUT exposing auth.users data
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

-- ==============================================
-- 2. Fix Security Definer Views
-- ==============================================

-- Drop and recreate all views without SECURITY DEFINER
DROP VIEW IF EXISTS professor_stats CASCADE;
DROP VIEW IF EXISTS professor_summary CASCADE;
DROP VIEW IF EXISTS professor_course_list CASCADE;

-- Recreate professor_stats view (no SECURITY DEFINER)
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

-- Recreate professor_summary view (no SECURITY DEFINER)
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

-- Recreate professor_course_list view (no SECURITY DEFINER)
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
-- 3. Add Missing RLS Policies
-- ==============================================

-- Ensure all tables have RLS enabled
ALTER TABLE outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_engagement ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for outlines table (if not already present)
DROP POLICY IF EXISTS "Allow all users to read outlines" ON outlines;
DROP POLICY IF EXISTS "Allow authenticated users to update outlines" ON outlines;
DROP POLICY IF EXISTS "Allow authenticated users to insert outlines" ON outlines;

CREATE POLICY "Allow all users to read outlines" ON outlines
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to update outlines" ON outlines
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert outlines" ON outlines
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add RLS policies for exams table (if not already present)
DROP POLICY IF EXISTS "Anyone can read exams" ON exams;
DROP POLICY IF EXISTS "Authenticated users can insert exams" ON exams;
DROP POLICY IF EXISTS "Authenticated users can update exams" ON exams;
DROP POLICY IF EXISTS "Authenticated users can delete exams" ON exams;

CREATE POLICY "Anyone can read exams" ON exams
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert exams" ON exams
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update exams" ON exams
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete exams" ON exams
    FOR DELETE USING (auth.role() = 'authenticated');

-- ==============================================
-- 4. Performance Optimizations
-- ==============================================

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_professor_course_rating ON reviews(professor_name, course_name, overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at_desc ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_grade ON reviews(grade);
CREATE INDEX IF NOT EXISTS idx_reviews_semester_year ON reviews(semester, year);

-- Add indexes for outlines table
CREATE INDEX IF NOT EXISTS idx_outlines_course_instructor_rating ON outlines(course, instructor, rating DESC);
CREATE INDEX IF NOT EXISTS idx_outlines_created_at_desc ON outlines(created_at DESC);

-- Add indexes for exams table
CREATE INDEX IF NOT EXISTS idx_exams_course_instructor_rating ON exams(course, instructor, rating DESC);
CREATE INDEX IF NOT EXISTS idx_exams_created_at_desc ON exams(created_at DESC);

-- ==============================================
-- 5. Grant Proper Permissions
-- ==============================================

-- Grant permissions for views
GRANT SELECT ON recent_reviews TO anon, authenticated;
GRANT SELECT ON professor_stats TO anon, authenticated;
GRANT SELECT ON professor_summary TO anon, authenticated;
GRANT SELECT ON professor_course_list TO anon, authenticated;

-- Grant permissions for tables
GRANT SELECT ON outlines TO anon, authenticated;
GRANT INSERT, UPDATE ON outlines TO authenticated;
GRANT SELECT ON exams TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON exams TO authenticated;
GRANT SELECT ON professors TO anon, authenticated;
GRANT ALL ON professors TO authenticated;
GRANT SELECT ON courses TO anon, authenticated;
GRANT ALL ON courses TO authenticated;
GRANT SELECT ON professor_courses TO anon, authenticated;
GRANT ALL ON professor_courses TO authenticated;
GRANT SELECT ON reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON reviews TO authenticated;
GRANT ALL ON review_engagement TO authenticated;

-- ==============================================
-- 6. Verification Queries
-- ==============================================

-- Test that views work without exposing auth data
SELECT 'Testing recent_reviews view (should not expose auth.users):' as test;
SELECT COUNT(*) as review_count FROM recent_reviews LIMIT 1;

SELECT 'Testing professor_stats view:' as test;
SELECT COUNT(*) as stats_count FROM professor_stats LIMIT 1;

SELECT 'Testing professor_summary view:' as test;
SELECT COUNT(*) as summary_count FROM professor_summary LIMIT 1;

SELECT 'Testing professor_course_list view:' as test;
SELECT COUNT(*) as course_list_count FROM professor_course_list LIMIT 1;

-- Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('outlines', 'exams', 'professors', 'courses', 'professor_courses', 'reviews', 'review_engagement')
ORDER BY tablename;
