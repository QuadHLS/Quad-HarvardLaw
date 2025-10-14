-- Remove Numbered "First Year Legal Research and Writing" Courses
-- This script removes courses like "First Year Legal Research and Writing 1A", "1B", "2A", "2B", etc.

-- Step 1: Check current "First Year Legal Research and Writing" courses with numbers
SELECT 
    name,
    COUNT(*) as count
FROM feedcourses 
WHERE name LIKE 'First Year Legal Research and Writing %'
GROUP BY name
ORDER BY name;

-- Step 2: Check if base "First Year Legal Research and Writing" already exists
SELECT 
    name,
    COUNT(*) as count
FROM feedcourses 
WHERE name = 'First Year Legal Research and Writing'
GROUP BY name;

-- Step 3: Show which numbered courses will be deleted
SELECT 
    id,
    name,
    created_at,
    'WILL BE DELETED' as status
FROM feedcourses 
WHERE name LIKE 'First Year Legal Research and Writing %'
AND name != 'First Year Legal Research and Writing'
ORDER BY name;

-- Step 4: Delete numbered "First Year Legal Research and Writing" courses
DELETE FROM feedcourses 
WHERE name LIKE 'First Year Legal Research and Writing %'
AND name != 'First Year Legal Research and Writing';

-- Step 5: Insert base "First Year Legal Research and Writing" if it doesn't exist
INSERT INTO feedcourses (name)
SELECT 'First Year Legal Research and Writing'
WHERE NOT EXISTS (
    SELECT 1 FROM feedcourses WHERE name = 'First Year Legal Research and Writing'
);

-- Step 6: Verify final result
SELECT 
    name,
    COUNT(*) as count
FROM feedcourses 
WHERE name LIKE 'First Year Legal Research and Writing%'
GROUP BY name
ORDER BY name;

-- Step 7: Check total count
SELECT 
    COUNT(*) as total_first_year_lrw_courses
FROM feedcourses 
WHERE name LIKE 'First Year Legal Research and Writing%';
