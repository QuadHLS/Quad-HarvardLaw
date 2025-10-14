-- Remove Numbered 1L Courses from feedcourses Table
-- This script removes courses with section numbers (1-7) and keeps only the base course names
-- for the 7 required 1L courses: Civil Procedure, Contracts, Criminal Law, Torts, Constitutional Law, Property, Legislation and Regulation

-- Step 1: Check current 1L courses with numbers
SELECT 
    name,
    COUNT(*) as count
FROM feedcourses 
WHERE name ~ '^(Civil Procedure|Contracts|Criminal Law|Torts|Constitutional Law|Property|Legislation and Regulation)\s+[1-7]$'
GROUP BY name
ORDER BY name;

-- Step 2: Check if base course names already exist
SELECT 
    name,
    COUNT(*) as count
FROM feedcourses 
WHERE name IN (
    'Civil Procedure',
    'Contracts', 
    'Criminal Law',
    'Torts',
    'Constitutional Law',
    'Property',
    'Legislation and Regulation'
)
GROUP BY name
ORDER BY name;

-- Step 3: Show which numbered courses will be deleted
SELECT 
    id,
    name,
    created_at,
    'WILL BE DELETED' as status
FROM feedcourses 
WHERE name ~ '^(Civil Procedure|Contracts|Criminal Law|Torts|Constitutional Law|Property|Legislation and Regulation)\s+[1-7]$'
ORDER BY name;

-- Step 4: Delete numbered 1L courses
DELETE FROM feedcourses 
WHERE name ~ '^(Civil Procedure|Contracts|Criminal Law|Torts|Constitutional Law|Property|Legislation and Regulation)\s+[1-7]$';

-- Step 5: Insert base course names if they don't exist
INSERT INTO feedcourses (name)
SELECT base_name
FROM (
    VALUES 
        ('Civil Procedure'),
        ('Contracts'),
        ('Criminal Law'),
        ('Torts'),
        ('Constitutional Law'),
        ('Property'),
        ('Legislation and Regulation')
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
    'Civil Procedure',
    'Contracts', 
    'Criminal Law',
    'Torts',
    'Constitutional Law',
    'Property',
    'Legislation and Regulation'
)
GROUP BY name
ORDER BY name;

-- Step 7: Check total count
SELECT 
    COUNT(*) as total_1l_base_courses
FROM feedcourses 
WHERE name IN (
    'Civil Procedure',
    'Contracts', 
    'Criminal Law',
    'Torts',
    'Constitutional Law',
    'Property',
    'Legislation and Regulation'
);
