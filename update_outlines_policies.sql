-- Update outlines table policies from public to authenticated
-- Match the same pattern as exams policies
-- Also optimizes to use (select auth.uid()) for better performance
--
-- Note: Preview functionality (Google Docs/Office Online) works independently:
-- - PDF previews use signed URLs from storage (requires auth to generate, but URL is public)
-- - DOCX previews use proxy API with service role key (bypasses RLS)
-- - External viewers access URLs, not the database table
-- Therefore, outlines table can be authenticated without affecting previews
--
-- Operations used:
-- - SELECT: View all outlines
-- - INSERT: Upload new outlines
-- - UPDATE: NOT used by frontend (only Python script uses service role)
-- - DELETE: NOT used

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all users to read outlines" ON outlines;
DROP POLICY IF EXISTS "Allow authenticated users to insert outlines" ON outlines;
DROP POLICY IF EXISTS "Allow authenticated users to update outlines" ON outlines;

-- Recreate policies for authenticated users only
-- Only SELECT and INSERT are needed - users never update/delete outline records
-- Already optimized with (select auth.uid()), just changing role and simplifying logic

-- SELECT: Authenticated users can view all outlines
CREATE POLICY "Authenticated users can view outlines" ON outlines
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can insert new outlines (for uploads)
CREATE POLICY "Authenticated users can insert outlines" ON outlines
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL);

