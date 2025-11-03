-- Update comments table policies from public to authenticated
-- Also optimizes to use (select auth.uid()) for better performance

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Recreate policies for authenticated users only
-- Optimized to use (select auth.uid()) for better performance
CREATE POLICY "Users can view all comments" ON comments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create comments" ON comments
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = author_id);

CREATE POLICY "Users can update their own comments" ON comments
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = author_id)
WITH CHECK ((select auth.uid()) = author_id);

CREATE POLICY "Users can delete their own comments" ON comments
FOR DELETE
TO authenticated
USING ((select auth.uid()) = author_id);

