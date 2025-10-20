-- Step 1: Drop the RLS policy that depends on feedcourses
DROP POLICY IF EXISTS "Users can view enrollments for their courses" ON course_enrollments;

-- Step 2: Create new RLS policy that uses Courses table instead
-- This checks if the course_id is in the user's enrolled courses (from profiles.classes)
CREATE POLICY "Users can view enrollments for their courses" ON course_enrollments
FOR SELECT
USING (
  course_id IN (
    SELECT (jsonb_array_elements(profiles.classes)->>'course_id')::uuid
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Step 3: Drop the old foreign key constraints referencing feedcourses
ALTER TABLE course_enrollments 
DROP CONSTRAINT IF EXISTS course_enrollments_course_id_fkey;

ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_course_id_fkey;

-- Step 4: Add new foreign key constraints referencing Courses table
ALTER TABLE course_enrollments 
ADD CONSTRAINT course_enrollments_course_id_fkey 
FOREIGN KEY (course_id) 
REFERENCES "Courses"(id) 
ON DELETE CASCADE;

ALTER TABLE posts 
ADD CONSTRAINT posts_course_id_fkey 
FOREIGN KEY (course_id) 
REFERENCES "Courses"(id) 
ON DELETE SET NULL;

-- Step 5: Now safely drop the feedcourses table
DROP TABLE feedcourses;

