-- Update posts table policies from public to authenticated
-- Also optimizes to use (select auth.uid()) for better performance
--
-- Operations used:
-- - SELECT: View all posts (for displaying feed)
-- - INSERT: Create posts
-- - UPDATE: Edit own posts
-- - DELETE: Delete own posts

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- Recreate policies for authenticated users only
-- Optimized to use (select auth.uid()) for better performance

-- SELECT: Authenticated users can view all posts
-- This allows viewing all posts in the feed
CREATE POLICY "Authenticated users can view all posts" ON posts
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can create posts
-- Users can only insert posts where author_id matches their auth.uid()
CREATE POLICY "Authenticated users can insert their own posts" ON posts
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = author_id);

-- UPDATE: Authenticated users can update their own posts
-- Users can only update posts where author_id matches their auth.uid()
CREATE POLICY "Authenticated users can update their own posts" ON posts
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = author_id)
WITH CHECK ((select auth.uid()) = author_id);

-- DELETE: Authenticated users can delete their own posts
-- Users can only delete posts where author_id matches their auth.uid()
CREATE POLICY "Authenticated users can delete their own posts" ON posts
FOR DELETE
TO authenticated
USING ((select auth.uid()) = author_id);

