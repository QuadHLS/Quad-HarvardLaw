-- COMPREHENSIVE DATABASE OPERATIONS TEST
-- This script tests all the main database operations used by the app
-- to ensure our RLS policy changes didn't break anything

-- ==============================================
-- Test 1: Basic Table Access (Public Read Operations)
-- ==============================================

-- Test courses table (used in ReviewsPage, CourseSelectionPage)
SELECT 'Testing courses table access' as test_name;
SELECT COUNT(*) as courses_count FROM public.courses LIMIT 1;

-- Test professors table (used in ReviewsPage)
SELECT 'Testing professors table access' as test_name;
SELECT COUNT(*) as professors_count FROM public.professors LIMIT 1;

-- Test professor_courses table (used in ReviewsPage)
SELECT 'Testing professor_courses table access' as test_name;
SELECT COUNT(*) as professor_courses_count FROM public.professor_courses LIMIT 1;

-- Test outlines table (used in filterUtils, App.tsx)
SELECT 'Testing outlines table access' as test_name;
SELECT COUNT(*) as outlines_count FROM public.outlines LIMIT 1;

-- Test exams table (used in App.tsx)
SELECT 'Testing exams table access' as test_name;
SELECT COUNT(*) as exams_count FROM public.exams LIMIT 1;

-- Test Courses table (capital C - used in CourseSelectionPage)
SELECT 'Testing Courses table access' as test_name;
SELECT COUNT(*) as Courses_count FROM public."Courses" LIMIT 1;

-- ==============================================
-- Test 2: User-Specific Operations (Authenticated)
-- ==============================================

-- Test profiles table (used in HomePage, App.tsx)
SELECT 'Testing profiles table access' as test_name;
SELECT COUNT(*) as profiles_count FROM public.profiles LIMIT 1;

-- Test reviews table (used in ReviewsPage)
SELECT 'Testing reviews table access' as test_name;
SELECT COUNT(*) as reviews_count FROM public.reviews LIMIT 1;

-- Test professor_stats view (used in ReviewsPage)
SELECT 'Testing professor_stats view access' as test_name;
SELECT COUNT(*) as professor_stats_count FROM public.professor_stats LIMIT 1;

-- ==============================================
-- Test 3: RPC Functions (used in ReviewsPage)
-- ==============================================

-- Test get_user_votes function
SELECT 'Testing get_user_votes function' as test_name;
SELECT public.get_user_votes(ARRAY[]::uuid[]) as user_votes_result;

-- Test is_user_verified function
SELECT 'Testing is_user_verified function' as test_name;
SELECT public.is_user_verified() as is_verified_result;

-- ==============================================
-- Test 4: Complex Queries (Real App Scenarios)
-- ==============================================

-- Test ReviewsPage query pattern
SELECT 'Testing ReviewsPage query pattern' as test_name;
SELECT 
    r.id,
    r.course,
    r.professor,
    r.rating,
    r.created_at
FROM public.reviews r
ORDER BY r.created_at DESC
LIMIT 5;

-- Test CourseSelectionPage query pattern
SELECT 'Testing CourseSelectionPage query pattern' as test_name;
SELECT 
    course_number,
    course_name,
    instructor,
    credits
FROM public."Courses"
ORDER BY course_name
LIMIT 5;

-- Test filterUtils query pattern
SELECT 'Testing filterUtils query pattern' as test_name;
SELECT DISTINCT course
FROM public.outlines
LIMIT 10;

-- ==============================================
-- Test 5: RLS Policy Verification
-- ==============================================

-- Check if RLS is enabled on critical tables
SELECT 'Checking RLS status on critical tables' as test_name;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('courses', 'professors', 'professor_courses', 'outlines', 'exams', 'profiles', 'reviews', 'Courses')
ORDER BY tablename;

-- Check policy counts per table
SELECT 'Checking policy counts per table' as test_name;
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('courses', 'professors', 'professor_courses', 'outlines', 'exams', 'profiles', 'reviews', 'Courses')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ==============================================
-- Test 6: Performance Check
-- ==============================================

-- Check for any remaining performance warnings
SELECT 'Checking for performance warnings' as test_name;
SELECT 
    schemaname,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN qual LIKE '%(select auth.%' OR with_check LIKE '%(select auth.%' THEN 1 END) as optimized_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
HAVING COUNT(*) > 0
ORDER BY tablename;

-- Final summary
SELECT 'Database operations test completed successfully!' as final_status;
