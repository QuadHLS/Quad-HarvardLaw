-- Update poll_options table policies from public to authenticated
-- Also optimizes to use (select auth.uid()) for better performance
--
-- Operations used:
-- - SELECT: View poll options (for displaying polls)
-- - INSERT: Create poll options (when creating poll posts)
-- - UPDATE: NOT used by frontend
-- - DELETE: NOT used by frontend

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view poll options" ON poll_options;
DROP POLICY IF EXISTS "Users can create poll options" ON poll_options;

-- Recreate policies for authenticated users only
-- Optimized to use (select auth.uid()) for better performance

-- SELECT: Authenticated users can view all poll options
-- This allows viewing poll options for polls
CREATE POLICY "Authenticated users can view poll options" ON poll_options
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can create poll options
-- Users can insert poll options when creating poll posts
CREATE POLICY "Authenticated users can insert poll options" ON poll_options
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL);

