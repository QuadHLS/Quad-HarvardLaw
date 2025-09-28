-- FIX FINAL 4 FUNCTIONS WITH MISSING SEARCH_PATH
-- This script fixes the remaining 4 functions that still have mutable search_path

-- ==============================================
-- Step 1: Fix refresh_professor_views function
-- ==============================================

-- First, drop the existing function to avoid return type conflicts
DROP FUNCTION IF EXISTS public.refresh_professor_views();

-- Now create the function with proper search_path
CREATE OR REPLACE FUNCTION public.refresh_professor_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.professor_stats;
END;
$$;

-- ==============================================
-- Step 2: Fix update_exams_updated_at function
-- ==============================================

-- Use CREATE OR REPLACE to avoid dependency issues
CREATE OR REPLACE FUNCTION public.update_exams_updated_at()
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
-- Step 3: Fix update_reviews_updated_at function
-- ==============================================

-- Use CREATE OR REPLACE to avoid dependency issues
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
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
-- Step 4: Fix update_updated_at_column function
-- ==============================================

-- Use CREATE OR REPLACE to avoid dependency issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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
-- Step 5: Grant permissions
-- ==============================================

GRANT EXECUTE ON FUNCTION public.refresh_professor_views() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_exams_updated_at() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_reviews_updated_at() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon, authenticated;

-- ==============================================
-- Step 6: Final verification
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
    'refresh_professor_views',
    'update_exams_updated_at',
    'update_reviews_updated_at',
    'update_updated_at_column'
)
ORDER BY p.proname, p.oid;
