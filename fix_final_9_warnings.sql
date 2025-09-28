-- FIX FINAL 9 PERFORMANCE WARNINGS
-- This script fixes the remaining 9 performance warnings

-- ==============================================
-- Step 1: Fix Multiple Permissive Policies issues
-- ==============================================

-- The issue is that we have multiple policies for the same role and action
-- We need to consolidate them into single policies

-- For courses table - consolidate into single policy per action
DROP POLICY IF EXISTS "Public can read courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON public.courses;

-- Create single consolidated policy
CREATE POLICY "Public can read courses" ON public.courses
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can manage courses" ON public.courses
FOR ALL
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
)
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- For exams table - consolidate into single policy per action
DROP POLICY IF EXISTS "Public can read exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can manage exams" ON public.exams;

-- Create single consolidated policy
CREATE POLICY "Public can read exams" ON public.exams
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can manage exams" ON public.exams
FOR ALL
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
)
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- For invite_list table - consolidate into single policy per action
DROP POLICY IF EXISTS "Service role can manage invite list" ON public.invite_list;
DROP POLICY IF EXISTS "Authenticated users can read invite list" ON public.invite_list;

-- Create single consolidated policy
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

-- For professor_courses table - consolidate into single policy per action
DROP POLICY IF EXISTS "Public can read professor_courses" ON public.professor_courses;
DROP POLICY IF EXISTS "Authenticated users can manage professor_courses" ON public.professor_courses;

-- Create single consolidated policy
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

-- For professors table - consolidate into single policy per action
DROP POLICY IF EXISTS "Public can read professors" ON public.professors;
DROP POLICY IF EXISTS "Authenticated users can manage professors" ON public.professors;

-- Create single consolidated policy
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
-- Step 2: Fix Duplicate Index issues
-- ==============================================

-- Remove duplicate indexes based on the Performance Advisor findings

-- For bar_count table - remove duplicate index (it's a constraint, so drop the constraint)
ALTER TABLE public.bar_count DROP CONSTRAINT IF EXISTS bar_count_uuid_key;

-- For exams table - remove duplicate index
DROP INDEX IF EXISTS public.idx_exams_created_at_desc;

-- For outlines table - remove duplicate index
DROP INDEX IF EXISTS public.idx_outlines_created_at_desc;

-- For reviews table - remove duplicate index
DROP INDEX IF EXISTS public.idx_reviews_created_at_desc;

-- ==============================================
-- Step 3: Final verification
-- ==============================================

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

-- Check remaining indexes
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('bar_count', 'exams', 'outlines', 'reviews')
ORDER BY tablename, indexname;

-- Summary of all policies
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
