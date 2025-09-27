-- Debug script to find why Courses table has 614 rows but courses table has 499
-- This will help identify the differences

-- 1. Check total rows in Courses table
SELECT 'Total rows in Courses table: ' || COUNT(*) as info
FROM "Courses";

-- 2. Check for NULL or empty course names
SELECT 'Rows with NULL or empty course_name: ' || COUNT(*) as info
FROM "Courses"
WHERE course_name IS NULL OR course_name = '';

-- 3. Check for duplicate course names
SELECT 
  'Unique course names in Courses table: ' || COUNT(DISTINCT course_name) as info
FROM "Courses"
WHERE course_name IS NOT NULL AND course_name != '';

-- 4. Show duplicate course names (if any)
SELECT 
  course_name,
  COUNT(*) as duplicate_count
FROM "Courses"
WHERE course_name IS NOT NULL AND course_name != ''
GROUP BY course_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- 5. Check for course names with extra whitespace
SELECT 
  'Course names with leading/trailing spaces: ' || COUNT(*) as info
FROM "Courses"
WHERE course_name IS NOT NULL 
  AND course_name != TRIM(course_name);

-- 6. Show some examples of course names with whitespace issues
SELECT 
  course_name,
  LENGTH(course_name) as original_length,
  LENGTH(TRIM(course_name)) as trimmed_length
FROM "Courses"
WHERE course_name IS NOT NULL 
  AND course_name != TRIM(course_name)
LIMIT 5;

-- 7. Compare what should have been inserted vs what was actually inserted
SELECT 
  'Expected unique courses: ' || COUNT(DISTINCT course_name) as expected
FROM "Courses"
WHERE course_name IS NOT NULL AND course_name != '';

SELECT 
  'Actually inserted courses: ' || COUNT(*) as actual
FROM courses;

-- 8. Show some course names that might not have been inserted
WITH expected_courses AS (
  SELECT DISTINCT TRIM(course_name) as course_name
  FROM "Courses"
  WHERE course_name IS NOT NULL AND course_name != ''
),
inserted_courses AS (
  SELECT name as course_name
  FROM courses
)
SELECT 
  ec.course_name as missing_course
FROM expected_courses ec
LEFT JOIN inserted_courses ic ON ec.course_name = ic.course_name
WHERE ic.course_name IS NULL
LIMIT 10;

