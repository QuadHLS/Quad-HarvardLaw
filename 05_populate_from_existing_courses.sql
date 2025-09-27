-- Populate professors and professor_courses tables from existing Courses table
-- This script reads from the existing Courses table and populates the new tables

-- First, insert all unique course names from the Courses table
INSERT INTO courses (name)
SELECT DISTINCT course_name
FROM "Courses"
WHERE course_name IS NOT NULL AND course_name != ''
ON CONFLICT (name) DO NOTHING;

-- Insert all unique professors from the instructor column
-- Handle semicolon-separated instructors by splitting them
WITH instructor_list AS (
  SELECT DISTINCT 
    TRIM(unnest(string_to_array(instructor, ';'))) as instructor_name
  FROM "Courses"
  WHERE instructor IS NOT NULL AND instructor != ''
)
INSERT INTO professors (name)
SELECT instructor_name
FROM instructor_list
WHERE instructor_name IS NOT NULL AND instructor_name != ''
ON CONFLICT (name) DO NOTHING;

-- Create professor-course relationships
-- Handle semicolon-separated instructors by creating separate entries for each
WITH instructor_courses AS (
  SELECT 
    course_name,
    TRIM(unnest(string_to_array(instructor, ';'))) as instructor_name
  FROM "Courses"
  WHERE course_name IS NOT NULL 
    AND course_name != ''
    AND instructor IS NOT NULL 
    AND instructor != ''
)
INSERT INTO professor_courses (professor_id, course_id)
SELECT DISTINCT p.id, c.id
FROM instructor_courses ic
JOIN professors p ON p.name = ic.instructor_name
JOIN courses c ON c.name = ic.course_name
ON CONFLICT (professor_id, course_id) DO NOTHING;

-- Display summary of what was inserted
SELECT 
  'Professors inserted: ' || COUNT(*) as summary
FROM professors;

SELECT 
  'Courses inserted: ' || COUNT(*) as summary
FROM courses;

SELECT 
  'Professor-Course relationships created: ' || COUNT(*) as summary
FROM professor_courses;

-- Show some sample data
SELECT 
  p.name as professor_name,
  c.name as course_name
FROM professor_courses pc
JOIN professors p ON pc.professor_id = p.id
JOIN courses c ON pc.course_id = c.id
ORDER BY p.name, c.name
LIMIT 10;

