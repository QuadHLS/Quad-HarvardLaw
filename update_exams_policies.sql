-- Update exams table policies from public to authenticated
-- Also optimizes to use (select auth.uid()) for better performance
--
-- Note: Preview functionality (Google Docs/Office Online) works independently:
-- - PDF previews use signed URLs from storage (requires auth to generate, but URL is public)
-- - DOCX previews use proxy API with service role key (bypasses RLS)
-- - External viewers access URLs, not the database table
-- Therefore, exams table can be authenticated without affecting previews

-- Drop existing policies
DROP POLICY IF EXISTS "exams_select_optimized" ON exams;
DROP POLICY IF EXISTS "exams_insert_optimized" ON exams;
DROP POLICY IF EXISTS "exams_update_optimized" ON exams;
DROP POLICY IF EXISTS "exams_delete_optimized" ON exams;

-- Recreate policies for authenticated users only
-- Only SELECT and INSERT are needed - users never update/delete exam records
-- Already optimized with (select auth.uid()), just changing role

-- SELECT: Authenticated users can view all exams
CREATE POLICY "Authenticated users can view exams" ON exams
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can insert new exams (for uploads)
CREATE POLICY "Authenticated users can insert exams" ON exams
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL);

