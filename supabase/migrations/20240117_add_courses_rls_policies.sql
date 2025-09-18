-- Enable RLS on Courses table (if not already enabled)
ALTER TABLE public."Courses" ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all courses
CREATE POLICY "Allow authenticated users to read courses" ON public."Courses"
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Policy: Allow anonymous users to read all courses (course catalogs are typically public)
CREATE POLICY "Allow anonymous users to read courses" ON public."Courses"
    FOR SELECT 
    TO anon 
    USING (true);

-- Optional: If you want to allow service role full access
CREATE POLICY "Allow service role full access to courses" ON public."Courses"
    FOR ALL 
    TO service_role 
    USING (true)
    WITH CHECK (true);

-- Grant SELECT permission to authenticated and anonymous roles
GRANT SELECT ON public."Courses" TO authenticated;
GRANT SELECT ON public."Courses" TO anon;
GRANT ALL ON public."Courses" TO service_role;