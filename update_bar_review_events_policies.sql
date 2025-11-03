-- Update bar_review_events table policy - simplify SELECT policy
-- Already authenticated, just simplifying the logic
--
-- Operations used:
-- - SELECT: View events (read-only reference table)
-- - INSERT: NOT used by frontend
-- - UPDATE: NOT used by frontend
-- - DELETE: NOT used by frontend
--
-- Note: This is a reference table that stores bar review event information
-- Users only need to read it, not modify it

-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users can view events" ON bar_review_events;

-- Recreate policy for authenticated users - SELECT only
-- Simplified to use USING (true) since we're already restricting to authenticated role
-- This is a read-only reference table
CREATE POLICY "Authenticated users can view bar review events" ON bar_review_events
FOR SELECT
TO authenticated
USING (true);

