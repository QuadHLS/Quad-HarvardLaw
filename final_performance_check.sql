-- FINAL PERFORMANCE CHECK AND OPTIMIZATION
-- This script performs a final check and optimization of remaining performance issues

-- ==============================================
-- Step 1: Check current performance status
-- ==============================================

-- Check for any remaining RLS policies that need optimization
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%(select auth.%' OR with_check LIKE '%(select auth.%' THEN 'OPTIMIZED'
        WHEN qual LIKE '%auth.%' OR with_check LIKE '%auth.%' THEN 'NEEDS OPTIMIZATION'
        ELSE 'NO AUTH CALLS'
    END as optimization_status,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND (
    qual LIKE '%auth.%' OR 
    with_check LIKE '%auth.%'
)
ORDER BY tablename, policyname;

-- ==============================================
-- Step 2: Check for duplicate indexes
-- ==============================================

-- Find duplicate indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('bar_count', 'exams', 'outlines', 'reviews')
ORDER BY tablename, indexname;

-- ==============================================
-- Step 3: Check for missing performance indexes
-- ==============================================

-- Check if our performance indexes exist
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ==============================================
-- Step 4: Add any missing critical indexes
-- ==============================================

-- Add indexes that might be missing
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_review_engagement_user_id ON public.review_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_review_engagement_review_id ON public.review_engagement(review_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_professor_name ON public.reviews(professor_name);
CREATE INDEX IF NOT EXISTS idx_reviews_course_name ON public.reviews(course_name);
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON public.user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_resources_user_id ON public.user_saved_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_user_id ON public.view_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_uploader_id ON public.resources(uploader_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_user_id ON public.resource_ratings(user_id);

-- ==============================================
-- Step 5: Final verification
-- ==============================================

-- Summary of all policies by table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN qual LIKE '%(select auth.%' OR with_check LIKE '%(select auth.%' THEN 1 END) as optimized_policies,
    COUNT(CASE WHEN qual LIKE '%auth.%' OR with_check LIKE '%auth.%' THEN 1 END) as total_auth_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Check for any remaining unoptimized policies
SELECT 
    'UNOPTIMIZED POLICIES' as status,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
AND (
    (qual LIKE '%auth.%' AND qual NOT LIKE '%(select auth.%') OR 
    (with_check LIKE '%auth.%' AND with_check NOT LIKE '%(select auth.%')
);
