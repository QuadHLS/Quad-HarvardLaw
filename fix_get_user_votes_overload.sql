-- FIX GET_USER_VOTES OVERLOADED FUNCTION
-- This script fixes the get_user_votes function that takes p_review_ids uuid[] parameter

-- ==============================================
-- Step 1: Check the current function definition
-- ==============================================

-- Get the current function definition for the overloaded version
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'get_user_votes'
AND pg_get_function_arguments(p.oid) LIKE '%p_review_ids%'
ORDER BY p.oid;

-- ==============================================
-- Step 2: Fix the overloaded get_user_votes function
-- ==============================================

-- Drop the existing overloaded function
DROP FUNCTION IF EXISTS public.get_user_votes(uuid[]);

-- Create the overloaded function with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_votes(p_review_ids uuid[])
RETURNS TABLE(
    review_id uuid,
    action text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        re.review_id,
        re.action
    FROM public.review_engagement re
    WHERE re.user_id = auth.uid()
    AND re.review_id = ANY(p_review_ids);
END;
$$;

-- ==============================================
-- Step 3: Grant permissions
-- ==============================================

GRANT EXECUTE ON FUNCTION public.get_user_votes(uuid[]) TO anon, authenticated;

-- ==============================================
-- Step 4: Verify the fix
-- ==============================================

-- Check that the overloaded function now has search_path set
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN 'FIXED - Has search_path'
        ELSE 'NOT FIXED - Missing search_path'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'get_user_votes'
ORDER BY p.oid;
