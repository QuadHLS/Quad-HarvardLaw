-- Fix the constraint to allow the full range that our conversion produces
-- If we convert 0.0-5.0 to 0.0-10.0, but we're getting values like 18.4,
-- we need to allow up to 20.0 (5.0 * 2 = 10.0, but there might be higher values)

-- Drop the existing constraint
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_overall_rating_check;

-- Add a new constraint that allows the 0.0-5.0 range
ALTER TABLE reviews ADD CONSTRAINT reviews_overall_rating_check 
CHECK (overall_rating >= 0.0 AND overall_rating <= 5.0);

-- Verify the constraint was updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'reviews'::regclass
  AND conname = 'reviews_overall_rating_check';
