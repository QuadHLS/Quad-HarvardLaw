-- Update professors table policy from ALL to SELECT only
-- Already authenticated, just optimizing and restricting to SELECT
--
-- Operations used:
-- - SELECT: View professors (read-only reference table)
-- - INSERT: NOT used by frontend
-- - UPDATE: NOT used by frontend
-- - DELETE: NOT used by frontend
--
-- Note: This is a reference table that stores professor information
-- Users only need to read it, not modify it

-- Drop existing ALL policy
DROP POLICY IF EXISTS "Authenticated users can access professors" ON professors;

-- Recreate policy for authenticated users - SELECT only
-- This is a read-only reference table
CREATE POLICY "Authenticated users can view professors" ON professors
FOR SELECT
TO authenticated
USING (true);

