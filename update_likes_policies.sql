-- Update likes table policies from public to authenticated
-- Also optimizes to use (select auth.uid()) for better performance
--
-- Operations used:
-- - SELECT: View all likes (for counts and checking if user liked)
-- - INSERT: Like posts/comments
-- - DELETE: Unlike posts/comments
-- - UPDATE: Not used

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;
DROP POLICY IF EXISTS "Users can view all likes" ON likes;

-- Recreate policies for authenticated users only
-- Optimized to use (select auth.uid()) for better performance

-- SELECT: Authenticated users can view all likes
-- This allows viewing like counts and checking if user liked items
CREATE POLICY "Authenticated users can view all likes" ON likes
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can create their own likes
-- Users can only insert likes where user_id matches their auth.uid()
CREATE POLICY "Authenticated users can insert their own likes" ON likes
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- DELETE: Authenticated users can delete their own likes
-- Users can only delete likes where user_id matches their auth.uid()
CREATE POLICY "Authenticated users can delete their own likes" ON likes
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

