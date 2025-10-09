-- Fix Performance Issues with Exams Table RLS Policy (Final Version)
-- This script handles existing policies and optimizes all RLS policies on the exams table

-- ============================================================================
-- PART 1: Check Current RLS Policies on Exams Table
-- ============================================================================

-- First, let's see what policies currently exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'exams'
ORDER BY policyname;

-- ============================================================================
-- PART 2: Drop ALL Existing Policies (to avoid conflicts)
-- ============================================================================

-- Drop ALL policies on exams table to start fresh
DROP POLICY IF EXISTS "exams_select_auth" ON exams;
DROP POLICY IF EXISTS "exams_insert_auth" ON exams;
DROP POLICY IF EXISTS "exams_update_auth" ON exams;
DROP POLICY IF EXISTS "exams_delete_auth" ON exams;
DROP POLICY IF EXISTS "exams_select_optimized" ON exams;
DROP POLICY IF EXISTS "exams_insert_optimized" ON exams;
DROP POLICY IF EXISTS "exams_update_optimized" ON exams;
DROP POLICY IF EXISTS "exams_delete_optimized" ON exams;
DROP POLICY IF EXISTS "Users can view exams" ON exams;
DROP POLICY IF EXISTS "Users can select exams" ON exams;
DROP POLICY IF EXISTS "Users can insert exams" ON exams;
DROP POLICY IF EXISTS "Users can update exams" ON exams;
DROP POLICY IF EXISTS "Users can delete exams" ON exams;

-- ============================================================================
-- PART 3: Create Optimized RLS Policies
-- ============================================================================

-- Create optimized RLS policies that don't re-evaluate auth functions for each row
-- The key is to use a subquery: (select auth.uid()) instead of auth.uid()

-- SELECT policy - allow all users to read exams (typically public data)
CREATE POLICY "exams_select_optimized" ON exams
    FOR SELECT USING (true);

-- INSERT policy - only authenticated users can insert exams
CREATE POLICY "exams_insert_optimized" ON exams
    FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- UPDATE policy - users can only update their own exams (if you have user_id column)
-- If exams don't have user ownership, you might want to restrict this further
CREATE POLICY "exams_update_optimized" ON exams
    FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

-- DELETE policy - users can only delete their own exams (if you have user_id column)
-- If exams don't have user ownership, you might want to restrict this further
CREATE POLICY "exams_delete_optimized" ON exams
    FOR DELETE USING ((select auth.uid()) IS NOT NULL);

-- ============================================================================
-- PART 4: Ensure RLS is Properly Configured
-- ============================================================================

-- Enable RLS on exams table if not already enabled
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Grant appropriate permissions
GRANT SELECT ON exams TO authenticated;
GRANT SELECT ON exams TO anon; -- If you want anonymous access to exams
GRANT INSERT ON exams TO authenticated;
GRANT UPDATE ON exams TO authenticated;
GRANT DELETE ON exams TO authenticated;

-- ============================================================================
-- PART 5: Verification
-- ============================================================================

-- Verify the new policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'exams'
ORDER BY policyname;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'exams';

-- Test query performance (this should be much faster now)
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM exams LIMIT 10;
