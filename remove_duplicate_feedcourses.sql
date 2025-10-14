-- Remove Duplicate Course Names in feedcourses Table
-- This script removes duplicate entries with EXACT same names, keeping only one entry per exact name
-- NOTE: This does NOT handle 1L courses with section numbers (like "Contracts 1" vs "Contracts 2")

-- Step 1: Check current duplicates (exact name matches only)
SELECT 
    name,
    COUNT(*) as duplicate_count
FROM feedcourses 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, name;

-- Step 2: Show which records will be deleted (for verification)
SELECT 
    fc1.id,
    fc1.name,
    fc1.created_at,
    'WILL BE DELETED' as status
FROM feedcourses fc1
WHERE fc1.id NOT IN (
    SELECT fc2.id
    FROM feedcourses fc2
    WHERE fc2.name = fc1.name
    ORDER BY fc2.created_at ASC
    LIMIT 1
)
ORDER BY fc1.name, fc1.created_at;

-- Step 3: Delete duplicate entries (keeping the one with the earliest created_at)
DELETE FROM feedcourses 
WHERE id NOT IN (
    SELECT DISTINCT ON (name) id
    FROM feedcourses
    ORDER BY name, created_at ASC
);

-- Step 4: Verify no duplicates remain
SELECT 
    name,
    COUNT(*) as count
FROM feedcourses 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Step 5: Show final count of unique course names
SELECT 
    COUNT(DISTINCT name) as unique_course_names,
    COUNT(*) as total_entries
FROM feedcourses;
