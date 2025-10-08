-- Check and fix the unique constraint that prevents multiple reviews

-- First, let's see what constraints exist on the reviews table
SELECT 'CONSTRAINTS ON REVIEWS TABLE:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'reviews'
GROUP BY tc.constraint_name, tc.constraint_type;

-- Drop the overly restrictive unique constraint
-- This constraint prevents users from submitting multiple reviews for the same course/professor
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS review_id_professor_name_course_name_semester_year_key CASCADE;

-- Also check for other similar constraints
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_user_id_professor_name_course_name_semester_year_key CASCADE;

ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_professor_name_course_name_semester_year_key CASCADE;

-- Verify the constraint was removed
SELECT 'REMAINING CONSTRAINTS:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'reviews'
GROUP BY tc.constraint_name, tc.constraint_type;

SELECT 'Unique constraint removed - you can now submit multiple reviews!' as result;
