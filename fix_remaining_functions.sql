-- FIX REMAINING FUNCTION SEARCH PATH ISSUES
-- This script fixes the remaining functions that still have mutable search_path

-- ==============================================
-- Step 1: Check what functions still need fixing
-- ==============================================

-- Get all function signatures for the problematic functions
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('get_user_votes', 'vote_on_review')
ORDER BY p.proname, p.oid;

-- ==============================================
-- Step 2: Fix get_user_votes function (all overloads)
-- ==============================================

-- Drop and recreate get_user_votes with proper search_path
-- First, let's see what the current function looks like
-- Then we'll recreate it with the correct signature

-- Fix get_user_votes function (assuming it takes no parameters)
CREATE OR REPLACE FUNCTION public.get_user_votes()
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
    WHERE re.user_id = auth.uid();
END;
$$;

-- ==============================================
-- Step 3: Fix vote_on_review function (all overloads)
-- ==============================================

-- First, drop the existing vote_on_review function if it exists
DROP FUNCTION IF EXISTS public.vote_on_review(uuid, text);

-- Now create the vote_on_review function with proper search_path
CREATE OR REPLACE FUNCTION public.vote_on_review(
    p_review_id uuid,
    p_action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Delete any existing vote from this user for this review
    DELETE FROM public.review_engagement 
    WHERE review_id = p_review_id 
    AND user_id = auth.uid() 
    AND action IN ('helpful', 'not_helpful');
    
    -- Insert the new vote
    INSERT INTO public.review_engagement (review_id, user_id, action, created_at)
    VALUES (p_review_id, auth.uid(), p_action, NOW());
END;
$$;

-- ==============================================
-- Step 4: Grant permissions
-- ==============================================

GRANT EXECUTE ON FUNCTION public.get_user_votes() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vote_on_review(uuid, text) TO anon, authenticated;

-- ==============================================
-- Step 5: Verify the fix
-- ==============================================

-- Check that all functions now have search_path set
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
AND p.proname IN (
    'is_user_verified',
    'refresh_professor_view',
    'get_professor_views_st',
    'update_exams_updated_a',
    'log_review_changes',
    'increment_review_engag',
    'update_reviews_updated',
    'get_user_votes',
    'update_updated_at_colu',
    'vote_on_review'
)
ORDER BY p.proname, p.oid;
