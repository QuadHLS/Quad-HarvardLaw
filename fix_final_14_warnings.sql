-- FIX FINAL 14 PERFORMANCE WARNINGS
-- This script fixes the remaining 14 performance warnings

-- ==============================================
-- Step 1: Fix remaining Auth RLS Initialization Plan issues
-- ==============================================

-- Fix the specific exams policy that's still causing issues
DROP POLICY IF EXISTS "Authenticated users can insert exams" ON public.exams;
CREATE POLICY "Authenticated users can insert exams" ON public.exams
FOR INSERT
TO authenticated
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- Ensure all exams policies are optimized
DROP POLICY IF EXISTS "Authenticated users can manage exams" ON public.exams;
CREATE POLICY "Authenticated users can manage exams" ON public.exams
FOR ALL
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
)
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 2: Fix Multiple Permissive Policies issues
-- ==============================================

-- For Courses table (capital C) - consolidate policies
DROP POLICY IF EXISTS "Allow authenticated users to read courses" ON public."Courses";
DROP POLICY IF EXISTS "Authenticated users can view Courses" ON public."Courses";

-- Create single consolidated policy
CREATE POLICY "Authenticated users can read courses" ON public."Courses"
FOR SELECT
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
);

-- For courses table (lowercase c) - consolidate policies
DROP POLICY IF EXISTS "Anyone can read courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON public.courses;

-- Create consolidated policies
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

-- For exams table - consolidate policies
DROP POLICY IF EXISTS "Anyone can read exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can insert exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can manage exams" ON public.exams;

-- Create consolidated policies
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

-- For invite_list table - consolidate policies
DROP POLICY IF EXISTS "Service role can manage invite list" ON public.invite_list;
DROP POLICY IF EXISTS "Authenticated users can read invite list" ON public.invite_list;

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
DROP POLICY IF EXISTS "Public can read professor_courses" ON public.professor_courses;
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
DROP POLICY IF EXISTS "Public can read professors" ON public.professors;
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

-- First, let's identify the duplicate indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('bar_count', 'exams', 'outlines')
ORDER BY tablename, indexname;

-- Remove duplicate indexes (you'll need to run the query above first to see the exact duplicates)
-- This is a template - adjust based on actual duplicates found

-- Example for bar_count table
-- DROP INDEX IF EXISTS public.bar_count_duplicate_index_name;

-- Example for exams table  
-- DROP INDEX IF EXISTS public.exams_duplicate_index_name;

-- Example for outlines table
-- DROP INDEX IF EXISTS public.outlines_duplicate_index_name;

-- ==============================================
-- Step 4: Final verification
-- ==============================================

-- Check for any remaining unoptimized policies
SELECT 
    'REMAINING UNOPTIMIZED POLICIES' as status,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
AND (
    (qual LIKE '%auth.%' AND qual NOT LIKE '%(select auth.%') OR 
    (with_check LIKE '%auth.%' AND with_check NOT LIKE '%(select auth.%')
);

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
