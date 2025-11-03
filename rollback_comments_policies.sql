-- Rollback: Restore original comments policies (public role)
-- Only use this if the authenticated policies break something

-- Drop new authenticated policies
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Recreate original policies with public role
CREATE POLICY "Users can view all comments" ON comments
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create comments" ON comments
FOR INSERT
TO public
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" ON comments
FOR UPDATE
TO public
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON comments
FOR DELETE
TO public
USING (auth.uid() = author_id);

