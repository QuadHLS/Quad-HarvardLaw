-- Check what the current constraint actually allows
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'reviews'::regclass
  AND conname = 'reviews_overall_rating_check';
