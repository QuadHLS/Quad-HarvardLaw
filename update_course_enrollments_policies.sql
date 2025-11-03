-- Update course_enrollments table policies from public to authenticated
-- Also optimizes to use (select auth.uid()) for better performance
--
-- Note: INSERT/UPDATE/DELETE are handled by database triggers,
-- but we still need proper RLS policies for security

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can view enrollments for their courses" ON course_enrollments;

-- Recreate policies for authenticated users only
-- Optimized to use (select auth.uid()) for better performance

-- SELECT: Users can view enrollments for courses they're enrolled in
-- This allows seeing who else is in your courses
CREATE POLICY "Users can view enrollments for their courses" ON course_enrollments
FOR SELECT
TO authenticated
USING (
  course_id IN (
    SELECT ((jsonb_array_elements(profiles.classes) ->> 'course_id'::text))::uuid AS uuid
    FROM profiles
    WHERE (profiles.id = (select auth.uid()))
  )
);

-- INSERT: Users can only insert their own enrollments
-- (Though typically handled by triggers, this provides security)
CREATE POLICY "Users can insert their own enrollments" ON course_enrollments
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Users can only update their own enrollments
-- (Though typically handled by triggers, this provides security)
CREATE POLICY "Users can update their own enrollments" ON course_enrollments
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- DELETE: Users can only delete their own enrollments
-- (Though typically handled by triggers, this provides security)
CREATE POLICY "Users can delete their own enrollments" ON course_enrollments
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

