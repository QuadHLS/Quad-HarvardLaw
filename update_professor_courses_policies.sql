-- Update professor_courses table policy from ALL to SELECT only
-- Already authenticated, just optimizing and restricting to SELECT
--
-- Operations used:
-- - SELECT: View professor-course relationships (read-only reference table)
-- - INSERT: NOT used by frontend
-- - UPDATE: NOT used by frontend
-- - DELETE: NOT used by frontend
--
-- Note: This is a reference/junction table that links professors to courses
-- Users only need to read it, not modify it

-- Drop existing ALL policy
DROP POLICY IF EXISTS "Authenticated users can access professor_courses" ON professor_courses;

-- Recreate policy for authenticated users - SELECT only
-- This is a read-only reference table
CREATE POLICY "Authenticated users can view professor_courses" ON professor_courses
FOR SELECT
TO authenticated
USING (true);

