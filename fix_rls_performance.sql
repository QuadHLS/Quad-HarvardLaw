-- FIX RLS PERFORMANCE ISSUES
-- This script fixes "Auth RLS Initialization Plan" performance issues
-- by replacing auth.<function>() with (select auth.<function>()) in RLS policies

-- ==============================================
-- Step 1: Check current RLS policies
-- ==============================================

-- Get all RLS policies that might have performance issues
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
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
-- Step 2: Fix RLS policies for calendar_events
-- ==============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users manage own calendar events" ON public.calendar_events;

-- Recreate with optimized auth function calls
CREATE POLICY "Users manage own calendar events" ON public.calendar_events
FOR ALL
TO authenticated
USING (
    user_id = (select auth.uid())
    AND (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 3: Fix RLS policies for user_courses
-- ==============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users manage own courses" ON public.user_courses;

-- Recreate with optimized auth function calls
CREATE POLICY "Users manage own courses" ON public.user_courses
FOR ALL
TO authenticated
USING (
    user_id = (select auth.uid())
    AND (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 4: Fix RLS policies for user_saved_resources
-- ==============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users manage own saved resources" ON public.user_saved_resources;

-- Recreate with optimized auth function calls
CREATE POLICY "Users manage own saved resources" ON public.user_saved_resources
FOR ALL
TO authenticated
USING (
    user_id = (select auth.uid())
    AND (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 5: Fix RLS policies for view_logs
-- ==============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users see own view logs" ON public.view_logs;

-- Recreate with optimized auth function calls
CREATE POLICY "Users see own view logs" ON public.view_logs
FOR ALL
TO authenticated
USING (
    user_id = (select auth.uid())
    AND (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 6: Fix RLS policies for resources
-- ==============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users read all resources" ON public.resources;
DROP POLICY IF EXISTS "Users upload own resources" ON public.resources;
DROP POLICY IF EXISTS "Users update own resources" ON public.resources;
DROP POLICY IF EXISTS "Users delete own resources" ON public.resources;

-- Recreate with optimized auth function calls
CREATE POLICY "Users read all resources" ON public.resources
FOR SELECT
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
);

CREATE POLICY "Users upload own resources" ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = (select auth.uid())
    AND (select auth.role()) = 'authenticated'
);

CREATE POLICY "Users update own resources" ON public.resources
FOR UPDATE
TO authenticated
USING (
    user_id = (select auth.uid())
    AND (select auth.role()) = 'authenticated'
);

CREATE POLICY "Users delete own resources" ON public.resources
FOR DELETE
TO authenticated
USING (
    user_id = (select auth.uid())
    AND (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 7: Fix RLS policies for resource_ratings
-- ==============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users read all resource ratings" ON public.resource_ratings;
DROP POLICY IF EXISTS "Users manage own resource ratings" ON public.resource_ratings;
DROP POLICY IF EXISTS "Users update own resource ratings" ON public.resource_ratings;
DROP POLICY IF EXISTS "Users delete own resource ratings" ON public.resource_ratings;

-- Recreate with optimized auth function calls
CREATE POLICY "Users read all resource ratings" ON public.resource_ratings
FOR SELECT
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
);

CREATE POLICY "Users manage own resource ratings" ON public.resource_ratings
FOR ALL
TO authenticated
USING (
    user_id = (select auth.uid())
    AND (select auth.role()) = 'authenticated'
);

CREATE POLICY "Users update own resource ratings" ON public.resource_ratings
FOR UPDATE
TO authenticated
USING (
    user_id = (select auth.uid())
    AND (select auth.role()) = 'authenticated'
);

CREATE POLICY "Users delete own resource ratings" ON public.resource_ratings
FOR DELETE
TO authenticated
USING (
    user_id = (select auth.uid())
    AND (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 8: Fix RLS policies for professors
-- ==============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users read all professors" ON public.professors;

-- Recreate with optimized auth function calls
CREATE POLICY "Users read all professors" ON public.professors
FOR SELECT
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 9: Fix RLS policies for courses
-- ==============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users read all courses" ON public.courses;

-- Recreate with optimized auth function calls
CREATE POLICY "Users read all courses" ON public.courses
FOR SELECT
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 10: Fix RLS policies for professor_courses
-- ==============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users read all professor courses" ON public.professor_courses;

-- Recreate with optimized auth function calls
CREATE POLICY "Users read all professor courses" ON public.professor_courses
FOR SELECT
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 11: Verification
-- ==============================================

-- Check that all policies now use optimized auth function calls
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
ORDER BY tablename, policyname;
