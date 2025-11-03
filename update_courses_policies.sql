-- Update courses table (lowercase) policy from ALL to SELECT only
-- Already authenticated, just optimizing and restricting to SELECT
--
-- Operations used:
-- - SELECT: View courses (read-only reference table)
-- - INSERT: NOT used by frontend
-- - UPDATE: NOT used by frontend
-- - DELETE: NOT used by frontend
--
-- Note: This is a reference table that stores course information
-- Users only need to read it, not modify it
-- Note: This is the lowercase 'courses' table (different from 'Courses' table)

-- Drop existing ALL policy
DROP POLICY IF EXISTS "Authenticated users can access courses" ON courses;

-- Recreate policy for authenticated users - SELECT only
-- This is a read-only reference table
CREATE POLICY "Authenticated users can view courses" ON courses
FOR SELECT
TO authenticated
USING (true);

