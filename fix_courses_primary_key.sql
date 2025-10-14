-- Fix Courses Table (uppercase C) Primary Key Issue
-- This script adds a primary key to the "Courses" table if it doesn't exist

-- Step 1: Add a primary key column to the Courses table
DO $$
BEGIN
    -- Check if the Courses table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Courses') THEN
        -- Check if the table already has a primary key
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'Courses' 
            AND constraint_type = 'PRIMARY KEY'
        ) THEN
            -- Add a primary key column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'Courses' 
                AND column_name = 'id'
            ) THEN
                -- Add the id column as primary key
                ALTER TABLE "Courses" ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
                RAISE NOTICE 'Added id column as primary key to Courses table';
            ELSE
                -- If id column exists but isn't primary key, make it the primary key
                ALTER TABLE "Courses" ADD PRIMARY KEY (id);
                RAISE NOTICE 'Made existing id column the primary key for Courses table';
            END IF;
        ELSE
            RAISE NOTICE 'Courses table already has a primary key';
        END IF;
    ELSE
        RAISE NOTICE 'Courses table does not exist';
    END IF;
END $$;

-- Step 2: Verify the table structure
SELECT 
    'Courses table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Courses' 
ORDER BY ordinal_position;

-- Step 3: Verify primary key constraint
SELECT 
    'Primary key constraint:' as info,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'Courses' AND constraint_type = 'PRIMARY KEY';