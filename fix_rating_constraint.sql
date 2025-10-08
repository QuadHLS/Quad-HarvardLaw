-- Fix the overall_rating constraint to allow 0.0 as minimum rating

-- Step 1: Drop the existing constraint
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_overall_rating_check;

-- Step 2: Add a new constraint that allows 0.0 to 10.0 range
ALTER TABLE reviews ADD CONSTRAINT reviews_overall_rating_check 
CHECK (overall_rating >= 0.0 AND overall_rating <= 10.0);

-- Step 3: Verify the constraint was updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'reviews'::regclass
  AND conname = 'reviews_overall_rating_check';
