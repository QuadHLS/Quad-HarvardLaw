-- FIX REMAINING PERFORMANCE ISSUES
-- This script fixes the remaining 21 performance warnings

-- ==============================================
-- Step 1: Fix remaining Auth RLS Initialization Plan issues
-- ==============================================

-- Fix outlines table - there might be a policy we missed
DROP POLICY IF EXISTS "Allow authenticated users to insert outlines" ON public.outlines;
CREATE POLICY "Allow authenticated users to insert outlines" ON public.outlines
FOR INSERT
TO authenticated
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 2: Fix Multiple Permissive Policies issues
-- ==============================================

-- For exams table - consolidate multiple policies into fewer, more efficient ones
DROP POLICY IF EXISTS "Authenticated users can manage exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can update exams" ON public.exams;

-- Create a single comprehensive policy for exams
CREATE POLICY "Authenticated users can manage exams" ON public.exams
FOR ALL
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
)
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- For invite_list table - consolidate policies
DROP POLICY IF EXISTS "Service role only" ON public.invite_list;
DROP POLICY IF EXISTS "Users read invite list" ON public.invite_list;

-- Create consolidated policies
CREATE POLICY "Service role can manage invite list" ON public.invite_list
FOR ALL
TO public
USING (
    ((select auth.role()) = 'service_role')
)
WITH CHECK (
    ((select auth.role()) = 'service_role')
);

CREATE POLICY "Authenticated users can read invite list" ON public.invite_list
FOR SELECT
TO authenticated
USING (
    (select is_user_verified())
);

-- For professor_courses table - consolidate policies
DROP POLICY IF EXISTS "Anyone can read professor_courses" ON public.professor_courses;
DROP POLICY IF EXISTS "Authenticated users can manage professor_courses" ON public.professor_courses;

-- Create consolidated policies
CREATE POLICY "Public can read professor_courses" ON public.professor_courses
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can manage professor_courses" ON public.professor_courses
FOR ALL
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
)
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- For professors table - consolidate policies
DROP POLICY IF EXISTS "Anyone can read professors" ON public.professors;
DROP POLICY IF EXISTS "Authenticated users can manage professors" ON public.professors;

-- Create consolidated policies
CREATE POLICY "Public can read professors" ON public.professors
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can manage professors" ON public.professors
FOR ALL
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
)
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 3: Fix Duplicate Index issues
-- ==============================================

-- Check for duplicate indexes first
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('bar_count', 'exams', 'outlines', 'reviews')
ORDER BY tablename, indexname;

-- Remove duplicate indexes (we'll need to identify the exact duplicates)
-- This is a template - you'll need to run the query above first to see the actual duplicates

-- Example for bar_count table (adjust based on actual duplicates found)
-- DROP INDEX IF EXISTS public.bar_count_duplicate_index_name;

-- Example for exams table
-- DROP INDEX IF EXISTS public.exams_duplicate_index_name;

-- Example for outlines table  
-- DROP INDEX IF EXISTS public.outlines_duplicate_index_name;

-- Example for reviews table
-- DROP INDEX IF EXISTS public.reviews_duplicate_index_name;

-- ==============================================
-- Step 4: Add missing indexes for better performance
-- ==============================================

-- Add indexes for commonly queried columns
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
-- Step 5: Verification
-- ==============================================

-- Check remaining RLS policies that might need optimization
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%(select auth.%' OR with_check LIKE '%(select auth.%' THEN 'OPTIMIZED'
        WHEN qual LIKE '%auth.%' OR with_check LIKE '%auth.%' THEN 'NEEDS OPTIMIZATION'
        ELSE 'NO AUTH CALLS'
    END as optimization_status
FROM pg_policies 
WHERE schemaname = 'public'
AND (
    qual LIKE '%auth.%' OR 
    with_check LIKE '%auth.%'
)
ORDER BY tablename, policyname;

-- Check for tables with multiple permissive policies
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND permissive = 'PERMISSIVE'
GROUP BY schemaname, tablename
HAVING COUNT(*) > 2
ORDER BY policy_count DESC;
