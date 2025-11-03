-- Update poll_votes table policies from public to authenticated
-- Also optimizes to use (select auth.uid()) for better performance
--
-- Operations used:
-- - SELECT: View poll votes (for checking user votes and vote counts)
-- - INSERT: Create poll votes (when voting on polls - one vote per user)
-- - UPDATE: NOT used by frontend (users can only vote once)
-- - DELETE: NOT used by frontend (votes are permanent)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own poll votes" ON poll_votes;
DROP POLICY IF EXISTS "Users can view all poll votes" ON poll_votes;

-- Recreate policies for authenticated users only
-- Optimized to use (select auth.uid()) for better performance

-- SELECT: Authenticated users can view all poll votes
-- This allows viewing vote counts and checking if user has voted
CREATE POLICY "Authenticated users can view poll votes" ON poll_votes
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can create their own poll votes
-- Users can only insert votes where user_id matches their auth.uid()
CREATE POLICY "Authenticated users can insert their own poll votes" ON poll_votes
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

