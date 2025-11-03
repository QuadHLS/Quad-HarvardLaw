-- Update planner table policy from public to authenticated
-- Only SELECT is used - planner is read-only for users (course catalog)
--
-- Operations used:
-- - SELECT: View all planner courses (read-only catalog)
-- - INSERT: NOT used by frontend
-- - UPDATE: NOT used by frontend
-- - DELETE: NOT used by frontend

-- Drop existing policy
DROP POLICY IF EXISTS "planner_select_policy" ON planner;

-- Recreate policy for authenticated users only
-- Authenticated users can view all planner courses (read-only catalog)
CREATE POLICY "Authenticated users can view planner courses" ON planner
FOR SELECT
TO authenticated
USING (true);

