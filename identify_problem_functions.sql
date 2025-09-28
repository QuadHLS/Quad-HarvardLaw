-- IDENTIFY PROBLEM FUNCTIONS
-- This script identifies exactly which functions are causing the Security Advisor warnings

-- ==============================================
-- Step 1: Find all functions that might be causing issues
-- ==============================================

-- Get all functions in public schema
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
ORDER BY p.proname, p.oid;

-- ==============================================
-- Step 2: Check which functions don't have search_path set
-- ==============================================

-- Check search_path status for all functions
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN 'HAS search_path'
        ELSE 'MISSING search_path'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname NOT LIKE 'pg_%'  -- Exclude system functions
AND p.proname NOT LIKE 'auth.%'  -- Exclude auth functions
ORDER BY p.proname, p.oid;
