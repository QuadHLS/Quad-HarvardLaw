-- Remove Numbered LRW Courses from feedcourses Table
-- This script removes LRW courses with section numbers (1A, 1B, 2A, 2B, etc.) and keeps only the base course names

-- Step 1: Check current LRW courses with numbers
SELECT 
    name,
    COUNT(*) as count
FROM feedcourses 
WHERE name ~ '^(First Year Legal Research and Writing|Legal Research and Writing)\s+[0-9]+[A-Z]?$'
GROUP BY name
ORDER BY name;

-- Step 2: Check if base LRW course names already exist
SELECT 
    name,
    COUNT(*) as count
FROM feedcourses 
WHERE name IN (
    'First Year Legal Research and Writing',
    'Legal Research and Writing'
)
GROUP BY name
ORDER BY name;

-- Step 3: Show which numbered LRW courses will be deleted
SELECT 
    id,
    name,
    created_at,
    'WILL BE DELETED' as status
FROM feedcourses 
WHERE name ~ '^(First Year Legal Research and Writing|Legal Research and Writing)\s+[0-9]+[A-Z]?$'
ORDER BY name;

-- Step 4: Delete numbered LRW courses
DELETE FROM feedcourses 
WHERE name ~ '^(First Year Legal Research and Writing|Legal Research and Writing)\s+[0-9]+[A-Z]?$';

-- Step 5: Insert base LRW course names if they don't exist
INSERT INTO feedcourses (name)
SELECT base_name
FROM (
    VALUES 
        ('First Year Legal Research and Writing'),
        ('Legal Research and Writing')
) AS base_courses(base_name)
WHERE base_name NOT IN (
    SELECT name FROM feedcourses WHERE name = base_courses.base_name
);

-- Step 6: Verify final result
SELECT 
    name,
    COUNT(*) as count
FROM feedcourses 
WHERE name IN (
    'First Year Legal Research and Writing',
    'Legal Research and Writing'
)
GROUP BY name
ORDER BY name;

-- Step 7: Check total count
SELECT 
    COUNT(*) as total_lrw_base_courses
FROM feedcourses 
WHERE name IN (
    'First Year Legal Research and Writing',
    'Legal Research and Writing'
);
