-- FIX ROLE CONFLICTS FOR MULTIPLE PERMISSIVE POLICIES
-- The issue is that authenticated users inherit from public role
-- So they get both "Public can read" and "Authenticated can manage" policies

-- Fix courses table - remove public policy, keep only authenticated
DROP POLICY IF EXISTS "Public can read courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON public.courses;

-- Create single policy for authenticated users (covers both read and write)
CREATE POLICY "Authenticated users can access courses" ON public.courses
FOR ALL TO authenticated USING ((select auth.role()) = 'authenticated');

-- Fix exams table - remove public policy, keep only authenticated  
DROP POLICY IF EXISTS "Public can read exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can manage exams" ON public.exams;

-- Create single policy for authenticated users
CREATE POLICY "Authenticated users can access exams" ON public.exams
FOR ALL TO authenticated USING ((select auth.role()) = 'authenticated');

-- Fix invite_list table - keep both but make them non-overlapping
DROP POLICY IF EXISTS "Service role can manage invite list" ON public.invite_list;
DROP POLICY IF EXISTS "Authenticated users can read invite list" ON public.invite_list;

-- Service role policy
CREATE POLICY "Service role can manage invite list" ON public.invite_list
FOR ALL TO public USING ((select auth.role()) = 'service_role');

-- Authenticated users policy (different action)
CREATE POLICY "Authenticated users can read invite list" ON public.invite_list
FOR SELECT TO authenticated USING ((select is_user_verified()));

-- Fix professor_courses table - remove public policy, keep only authenticated
DROP POLICY IF EXISTS "Public can read professor_courses" ON public.professor_courses;
DROP POLICY IF EXISTS "Authenticated users can manage professor_courses" ON public.professor_courses;

-- Create single policy for authenticated users
CREATE POLICY "Authenticated users can access professor_courses" ON public.professor_courses
FOR ALL TO authenticated USING ((select auth.role()) = 'authenticated');

-- Fix professors table - remove public policy, keep only authenticated
DROP POLICY IF EXISTS "Public can read professors" ON public.professors;
DROP POLICY IF EXISTS "Authenticated users can manage professors" ON public.professors;

-- Create single policy for authenticated users
CREATE POLICY "Authenticated users can access professors" ON public.professors
FOR ALL TO authenticated USING ((select auth.role()) = 'authenticated');
