-- FIX GET_USER_VOTES FUNCTION
-- The error shows that 're.action' column doesn't exist
-- This script fixes the function to use the correct column name

-- First, let's check what the correct column name should be
-- Based on common patterns, it's likely 'engagement_type' instead of 'action'

-- Drop and recreate the function with the correct column name
DROP FUNCTION IF EXISTS public.get_user_votes(uuid[]);

CREATE OR REPLACE FUNCTION public.get_user_votes(p_review_ids uuid[])
RETURNS TABLE(review_id uuid, engagement_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT
        re.review_id,
        re.engagement_type  -- Changed from 'action' to 'engagement_type'
    FROM public.review_engagement re
    WHERE re.user_id = auth.uid()
    AND re.review_id = ANY(p_review_ids);
END;
$$;

-- Alternative fix if the column is named differently
-- Uncomment and modify if needed:

/*
-- If the column is named 'action' but the table structure is different:
DROP FUNCTION IF EXISTS public.get_user_votes(uuid[]);

CREATE OR REPLACE FUNCTION public.get_user_votes(p_review_ids uuid[])
RETURNS TABLE(review_id uuid, engagement_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT
        re.review_id,
        re.action::text as engagement_type  -- Cast to text if needed
    FROM public.review_engagement re
    WHERE re.user_id = auth.uid()
    AND re.review_id = ANY(p_review_ids);
END;
$$;
*/

-- Test the function
SELECT 'Testing get_user_votes function' as test_name;
SELECT public.get_user_votes(ARRAY[]::uuid[]) as test_result;
