-- CHECK REVIEW_ENGAGEMENT TABLE SCHEMA
-- This script checks the actual column names in the review_engagement table

-- Check the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'review_engagement'
ORDER BY ordinal_position;

-- Check if the table exists and has data
SELECT COUNT(*) as total_records FROM public.review_engagement;

-- Check sample data to see actual column names
SELECT * FROM public.review_engagement LIMIT 5;

-- Check the current get_user_votes function definition
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'get_user_votes' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
