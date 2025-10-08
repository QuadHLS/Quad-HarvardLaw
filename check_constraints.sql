-- Check what constraints exist on the reviews table that might be causing the error

-- Check all constraints on the reviews table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'reviews'::regclass;

-- Check the overall_rating column specifically
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'reviews' AND column_name = 'overall_rating';

-- Check if there are any check constraints on overall_rating
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'reviews'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) ILIKE '%overall_rating%';
