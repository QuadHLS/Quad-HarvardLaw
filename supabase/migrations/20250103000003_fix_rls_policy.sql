-- Fix the infinite recursion in RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view enrollments for their courses" ON course_enrollments;

-- Create a simpler policy that doesn't cause recursion
-- Users can view enrollments for courses they're enrolled in (using profiles.classes)
CREATE POLICY "Users can view enrollments for their courses" ON course_enrollments
  FOR SELECT USING (
    course_id IN (
      SELECT fc.id 
      FROM feedcourses fc 
      WHERE fc.name = ANY(
        SELECT jsonb_array_elements_text(classes) 
        FROM profiles 
        WHERE id = auth.uid()
      )
    )
  );
