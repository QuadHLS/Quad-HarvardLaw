-- Update polls table policies from public to authenticated
-- Also optimizes to use (select auth.uid()) for better performance
--
-- Operations used:
-- - SELECT: View polls (for displaying poll posts)
-- - INSERT: Create polls (when creating poll posts)
-- - UPDATE: NOT used by frontend
-- - DELETE: NOT used by frontend

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view polls" ON polls;
DROP POLICY IF EXISTS "Users can create polls" ON polls;

-- Recreate policies for authenticated users only
-- Optimized to use (select auth.uid()) for better performance

-- SELECT: Authenticated users can view all polls
-- This allows viewing polls associated with posts
CREATE POLICY "Authenticated users can view polls" ON polls
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can create polls
-- Users can insert polls when creating poll posts
CREATE POLICY "Authenticated users can insert polls" ON polls
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL);

