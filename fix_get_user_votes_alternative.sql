-- ALTERNATIVE FIX FOR GET_USER_VOTES FUNCTION
-- If the first fix doesn't work, try these alternatives

-- Alternative 1: If column is named 'vote_type'
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
        re.vote_type::text as engagement_type  -- Using vote_type column
    FROM public.review_engagement re
    WHERE re.user_id = auth.uid()
    AND re.review_id = ANY(p_review_ids);
END;
$$;

-- Alternative 2: If column is named 'type'
/*
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
        re.type::text as engagement_type  -- Using type column
    FROM public.review_engagement re
    WHERE re.user_id = auth.uid()
    AND re.review_id = ANY(p_review_ids);
END;
$$;
*/

-- Alternative 3: If column is named 'action' but with different data type
/*
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
        re.action::text as engagement_type  -- Cast action to text
    FROM public.review_engagement re
    WHERE re.user_id = auth.uid()
    AND re.review_id = ANY(p_review_ids);
END;
$$;
*/

-- Test the function
SELECT 'Testing get_user_votes function with vote_type' as test_name;
SELECT public.get_user_votes(ARRAY[]::uuid[]) as test_result;
