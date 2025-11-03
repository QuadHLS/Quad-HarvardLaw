-- Update reviews table policies from public to authenticated
-- Also optimizes to use (select auth.uid()) for better performance
--
-- Operations used:
-- - SELECT: View all reviews (for displaying professor/course reviews)
-- - INSERT: Create reviews (any authenticated user can submit reviews)
-- - UPDATE: NOT used by frontend
-- - DELETE: NOT used by frontend
--
-- Note: Reviews don't track author_id, so any authenticated user can submit reviews

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;

-- Recreate policies for authenticated users only

-- SELECT: Authenticated users can view all reviews
-- This allows viewing all reviews for professors and courses
CREATE POLICY "Authenticated users can view reviews" ON reviews
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can insert reviews
-- Since reviews don't track author_id, any authenticated user can submit reviews
CREATE POLICY "Authenticated users can insert reviews" ON reviews
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL);

