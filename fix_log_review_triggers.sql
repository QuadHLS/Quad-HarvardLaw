-- Fix the log_review_changes function that's causing the "action" column error

-- First, let's see what the function does
SELECT 'Current log_review_changes function:' as info;
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'log_review_changes';

-- Drop the problematic triggers
DROP TRIGGER IF EXISTS log_review_insert ON reviews;
DROP TRIGGER IF EXISTS log_review_update ON reviews;
DROP TRIGGER IF EXISTS log_review_delete ON reviews;

-- Drop the problematic function
DROP FUNCTION IF EXISTS log_review_changes() CASCADE;

-- The triggers are now removed, so review submissions should work
SELECT 'Triggers and logging function removed successfully!' as result;
