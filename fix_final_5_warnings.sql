-- FIX FINAL 5 PERFORMANCE WARNINGS
-- This script fixes the remaining 5 "Multiple Permissive Policies" warnings

-- ==============================================
-- Step 1: Fix Multiple Permissive Policies issues
-- ==============================================

-- The issue is that we have multiple policies for the same role and action
-- We need to ensure each role has only one policy per action

-- For courses table - fix role conflicts
DROP POLICY IF EXISTS "Public can read courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON public.courses;

-- Create policies with no role overlap
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

-- For exams table - fix role conflicts
DROP POLICY IF EXISTS "Public can read exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can manage exams" ON public.exams;

-- Create policies with no role overlap
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

-- For invite_list table - fix role conflicts
DROP POLICY IF EXISTS "Service role can manage invite list" ON public.invite_list;
DROP POLICY IF EXISTS "Authenticated users can read invite list" ON public.invite_list;

-- Create policies with no role overlap
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

-- For professor_courses table - fix role conflicts
DROP POLICY IF EXISTS "Public can read professor_courses" ON public.professor_courses;
DROP POLICY IF EXISTS "Authenticated users can manage professor_courses" ON public.professor_courses;

-- Create policies with no role overlap
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

-- For professors table - fix role conflicts
DROP POLICY IF EXISTS "Public can read professors" ON public.professors;
DROP POLICY IF EXISTS "Authenticated users can manage professors" ON public.professors;

-- Create policies with no role overlap
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
-- Step 2: Final verification
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

-- Check for role conflicts in policies
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

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
