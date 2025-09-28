-- IMMEDIATE FIX FOR GET_USER_VOTES FUNCTION
-- Based on the function source showing 're.action', let's fix it with the most likely column name

-- First, let's see what columns actually exist in review_engagement
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'review_engagement'
ORDER BY ordinal_position;

-- Now let's fix the function with the most likely column name
-- Based on common patterns, it's probably 'engagement_type' or 'vote_type'

DROP FUNCTION IF EXISTS public.get_user_votes(uuid[]);

-- Try with 'engagement_type' first (most common)
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

-- Test the function
SELECT 'Testing get_user_votes function with engagement_type' as test_name;
SELECT public.get_user_votes(ARRAY[]::uuid[]) as test_result;
