-- Update bar_count table policies - optimize INSERT and DELETE
-- All policies already authenticated, just optimizing to use (select auth.uid())
--
-- Operations used:
-- - SELECT: View all RSVPs (to see who's attending)
-- - INSERT: Create RSVP (when user RSVPs)
-- - UPDATE: NOT used (policy explicitly prevents it)
-- - DELETE: Delete RSVP (when user cancels RSVP)
--
-- Note: UPDATE policy uses USING (false) to explicitly prevent updates, which is correct

-- Drop existing policies that need optimization
DROP POLICY IF EXISTS "Users can insert their own RSVP" ON bar_count;
DROP POLICY IF EXISTS "Users can delete their own RSVP" ON bar_count;

-- Recreate policies with optimization
-- SELECT and UPDATE policies are already good, just need to optimize INSERT/DELETE

-- INSERT: Authenticated users can insert their own RSVP
-- Users can only insert RSVPs where identity matches their auth.uid()
-- Optimized to use (select auth.uid()) for better performance
CREATE POLICY "Authenticated users can insert their own RSVP" ON bar_count
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = identity);

-- DELETE: Authenticated users can delete their own RSVP
-- Users can only delete RSVPs where identity matches their auth.uid()
-- Optimized to use (select auth.uid()) for better performance
CREATE POLICY "Authenticated users can delete their own RSVP" ON bar_count
FOR DELETE
TO authenticated
USING ((select auth.uid()) = identity);

-- Note: SELECT and UPDATE policies don't need changes:
-- - "Users can view all RSVPs" - SELECT, authenticated, USING (true) - already optimized
-- - "No updates allowed" - UPDATE, authenticated, USING (false) - correctly prevents updates

