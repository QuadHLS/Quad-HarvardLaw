-- FIX ALL REMAINING FUNCTION SEARCH PATH ISSUES
-- This script identifies and fixes ALL functions that still have mutable search_path

-- ==============================================
-- Step 1: Find ALL functions that need fixing
-- ==============================================

-- Get all functions in public schema that don't have search_path set
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname NOT LIKE 'pg_%'  -- Exclude system functions
AND p.proname NOT LIKE 'auth.%'  -- Exclude auth functions
AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%'  -- Only functions without search_path
ORDER BY p.proname, p.oid;

-- ==============================================
-- Step 2: Fix all identified functions
-- ==============================================

-- Fix refresh_professor_view function (if it exists with different name)
CREATE OR REPLACE FUNCTION public.refresh_professor_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.professor_stats;
END;
$$;

-- Fix get_professor_views_st function
CREATE OR REPLACE FUNCTION public.get_professor_views_st()
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

-- Fix update_exams_updated_a function
CREATE OR REPLACE FUNCTION public.update_exams_updated_a()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix increment_review_engag function
CREATE OR REPLACE FUNCTION public.increment_review_engag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.action = 'helpful' THEN
            UPDATE public.reviews 
            SET helpful_count = helpful_count + 1 
            WHERE id = NEW.review_id;
        ELSIF NEW.action = 'not_helpful' THEN
            UPDATE public.reviews 
            SET not_helpful_count = not_helpful_count + 1 
            WHERE id = NEW.review_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.action = 'helpful' THEN
            UPDATE public.reviews 
            SET helpful_count = helpful_count - 1 
            WHERE id = OLD.review_id;
        ELSIF OLD.action = 'not_helpful' THEN
            UPDATE public.reviews 
            SET not_helpful_count = not_helpful_count - 1 
            WHERE id = OLD.review_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Fix update_reviews_updated function
CREATE OR REPLACE FUNCTION public.update_reviews_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix update_updated_at_colu function
CREATE OR REPLACE FUNCTION public.update_updated_at_colu()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ==============================================
-- Step 3: Grant permissions
-- ==============================================

GRANT EXECUTE ON FUNCTION public.refresh_professor_view() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_professor_views_st() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_exams_updated_a() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_review_engag() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_reviews_updated() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_colu() TO anon, authenticated;

-- ==============================================
-- Step 4: Final verification
-- ==============================================

-- Check that ALL functions now have search_path set
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
AND p.proname NOT LIKE 'pg_%'  -- Exclude system functions
AND p.proname NOT LIKE 'auth.%'  -- Exclude auth functions
ORDER BY p.proname, p.oid;
