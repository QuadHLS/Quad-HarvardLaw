-- Fix overall_rating column type to support decimals
-- This script first checks what views/rules exist, then handles them safely

-- Step 1: Check what views exist that might use overall_rating
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition ILIKE '%overall_rating%'
   OR definition ILIKE '%reviews%';

-- Step 2: Check what rules exist that might use overall_rating
SELECT 
    schemaname,
    tablename,
    rulename,
    definition
FROM pg_rules 
WHERE tablename = 'reviews'
   OR definition ILIKE '%overall_rating%';

-- Step 3: Check what constraints exist on the overall_rating column
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'reviews'::regclass
  AND pg_get_constraintdef(oid) ILIKE '%overall_rating%';

-- Step 4: Try to alter the column type (this will show us what's blocking it)
-- If this fails, we'll know exactly what views/rules/constraints are causing the issue
ALTER TABLE reviews 
ALTER COLUMN overall_rating TYPE float4;

-- Step 5: Verify the change worked
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND column_name = 'overall_rating';
