-- Disable the ability for users to update or delete their reviews
-- Users can only VIEW and CREATE reviews, not edit or delete them

-- Check current policies
SELECT 'CURRENT POLICIES ON REVIEWS TABLE:' as info;
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
WHERE tablename = 'reviews';

-- Drop the UPDATE and DELETE policies
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

-- Also drop any other update/delete policies that might exist
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON reviews;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON reviews;
DROP POLICY IF EXISTS "Users can update reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete reviews" ON reviews;

-- Verify remaining policies (should only have SELECT and INSERT)
SELECT 'REMAINING POLICIES (should only be SELECT and INSERT):' as info;
SELECT 
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY cmd;

SELECT 'Reviews are now read-only after creation!' as result;
