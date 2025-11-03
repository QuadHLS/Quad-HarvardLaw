-- Update feedback table policy from public to authenticated
-- Only INSERT is used (no SELECT, UPDATE, or DELETE)
-- Policy already optimized with (select auth.uid()), just changing role

-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback;

-- Recreate policy for authenticated users only
-- Users can only insert feedback where user_id matches their auth.uid()
CREATE POLICY "Authenticated users can insert their own feedback" ON feedback
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

