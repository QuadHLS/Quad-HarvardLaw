-- Check ALL constraints on the reviews table to find what's causing the error

-- Check all constraints on the reviews table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'reviews'::regclass
ORDER BY conname;

-- Check all columns and their constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'reviews'
ORDER BY ordinal_position;

-- Check for any NOT NULL constraints that might be failing
SELECT 
    column_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND is_nullable = 'NO'
ORDER BY column_name;
