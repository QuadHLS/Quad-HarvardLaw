-- SIMPLE FIX FOR MULTIPLE PERMISSIVE POLICIES
-- This script fixes the 5 "Multiple Permissive Policies" warnings

-- Fix courses table
DROP POLICY IF EXISTS "Public can read courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON public.courses;

CREATE POLICY "Public can read courses" ON public.courses
FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage courses" ON public.courses
FOR ALL TO authenticated USING ((select auth.role()) = 'authenticated');

-- Fix exams table  
DROP POLICY IF EXISTS "Public can read exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can manage exams" ON public.exams;

CREATE POLICY "Public can read exams" ON public.exams
FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage exams" ON public.exams
FOR ALL TO authenticated USING ((select auth.role()) = 'authenticated');

-- Fix invite_list table
DROP POLICY IF EXISTS "Service role can manage invite list" ON public.invite_list;
DROP POLICY IF EXISTS "Authenticated users can read invite list" ON public.invite_list;

CREATE POLICY "Service role can manage invite list" ON public.invite_list
FOR ALL TO public USING ((select auth.role()) = 'service_role');

CREATE POLICY "Authenticated users can read invite list" ON public.invite_list
FOR SELECT TO authenticated USING ((select is_user_verified()));

-- Fix professor_courses table
DROP POLICY IF EXISTS "Public can read professor_courses" ON public.professor_courses;
DROP POLICY IF EXISTS "Authenticated users can manage professor_courses" ON public.professor_courses;

CREATE POLICY "Public can read professor_courses" ON public.professor_courses
FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage professor_courses" ON public.professor_courses
FOR ALL TO authenticated USING ((select auth.role()) = 'authenticated');

-- Fix professors table
DROP POLICY IF EXISTS "Public can read professors" ON public.professors;
DROP POLICY IF EXISTS "Authenticated users can manage professors" ON public.professors;

CREATE POLICY "Public can read professors" ON public.professors
FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage professors" ON public.professors
FOR ALL TO authenticated USING ((select auth.role()) = 'authenticated');
