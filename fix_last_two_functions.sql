-- FIX LAST 2 FUNCTIONS WITH MISSING SEARCH_PATH
-- This script fixes the remaining 2 functions that still have mutable search_path

-- ==============================================
-- Step 1: Check current function definitions
-- ==============================================

-- Get the current function definitions for the problematic functions
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('get_professor_views_status', 'increment_review_engagement')
ORDER BY p.proname, p.oid;

-- ==============================================
-- Step 2: Fix get_professor_views_status function
-- ==============================================

-- First, drop the existing function to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_professor_views_status();

-- Now create the function with proper search_path
CREATE OR REPLACE FUNCTION public.get_professor_views_status()
RETURNS TABLE(
    professor_name text,
    course_name text,
    total_reviews bigint,
    avg_overall_rating numeric,
    avg_readings_rating numeric,
    avg_cold_calls_rating numeric,
    avg_exam_rating numeric,
    ds_count bigint,
    h_count bigint,
    p_count bigint,
    laptops_allowed_count bigint,
    final_exam_count bigint,
    project_count bigint,
    both_count bigint,
    cold_calls_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.professor_name,
        ps.course_name,
        ps.total_reviews,
        ps.avg_overall_rating,
        ps.avg_readings_rating,
        ps.avg_cold_calls_rating,
        ps.avg_exam_rating,
        ps.ds_count,
        ps.h_count,
        ps.p_count,
        ps.laptops_allowed_count,
        ps.final_exam_count,
        ps.project_count,
        ps.both_count,
        ps.cold_calls_count
    FROM public.professor_stats ps;
END;
$$;

-- ==============================================
-- Step 3: Fix increment_review_engagement function
-- ==============================================

-- First, drop the existing function to avoid return type conflicts
DROP FUNCTION IF EXISTS public.increment_review_engagement(uuid, text);

-- Now create the function with proper search_path
CREATE OR REPLACE FUNCTION public.increment_review_engagement(
    review_id uuid,
    engagement_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Insert the engagement record
    INSERT INTO public.review_engagement (review_id, user_id, action, created_at)
    VALUES (review_id, auth.uid(), engagement_type, NOW());
    
    -- Update the review counts based on engagement type
    IF engagement_type = 'helpful' THEN
        UPDATE public.reviews 
        SET helpful_count = helpful_count + 1 
        WHERE id = review_id;
    ELSIF engagement_type = 'not_helpful' THEN
        UPDATE public.reviews 
        SET not_helpful_count = not_helpful_count + 1 
        WHERE id = review_id;
    END IF;
END;
$$;

-- ==============================================
-- Step 4: Grant permissions
-- ==============================================

GRANT EXECUTE ON FUNCTION public.get_professor_views_status() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_review_engagement(uuid, text) TO anon, authenticated;

-- ==============================================
-- Step 5: Final verification
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
AND p.proname IN ('get_professor_views_status', 'increment_review_engagement')
ORDER BY p.proname, p.oid;
