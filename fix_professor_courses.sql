-- Script to fix professor-course relationships
-- This script will ensure professors and courses exist, then create relationships

-- First, let's check what we have and create missing data

-- Insert sample professors if they don't exist
INSERT INTO professors (name) 
SELECT 'Professor Smith' 
WHERE NOT EXISTS (SELECT 1 FROM professors WHERE name = 'Professor Smith');

INSERT INTO professors (name) 
SELECT 'Professor Johnson' 
WHERE NOT EXISTS (SELECT 1 FROM professors WHERE name = 'Professor Johnson');

INSERT INTO professors (name) 
SELECT 'Professor Williams' 
WHERE NOT EXISTS (SELECT 1 FROM professors WHERE name = 'Professor Williams');

INSERT INTO professors (name) 
SELECT 'Professor Brown' 
WHERE NOT EXISTS (SELECT 1 FROM professors WHERE name = 'Professor Brown');

INSERT INTO professors (name) 
SELECT 'Professor Davis' 
WHERE NOT EXISTS (SELECT 1 FROM professors WHERE name = 'Professor Davis');

-- Insert sample courses if they don't exist
INSERT INTO courses (name) 
SELECT 'Contracts' 
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE name = 'Contracts');

INSERT INTO courses (name) 
SELECT 'Torts' 
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE name = 'Torts');

INSERT INTO courses (name) 
SELECT 'Criminal Law' 
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE name = 'Criminal Law');

INSERT INTO courses (name) 
SELECT 'Constitutional Law' 
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE name = 'Constitutional Law');

INSERT INTO courses (name) 
SELECT 'Property' 
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE name = 'Property');

INSERT INTO courses (name) 
SELECT 'Civil Procedure' 
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE name = 'Civil Procedure');

INSERT INTO courses (name) 
SELECT 'Evidence' 
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE name = 'Evidence');

INSERT INTO courses (name) 
SELECT 'Professional Responsibility' 
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE name = 'Professional Responsibility');

-- Now create professor-course relationships (only if they don't already exist)
INSERT INTO professor_courses (professor_id, course_id)
SELECT p.id, c.id
FROM professors p, courses c
WHERE p.name = 'Professor Smith' AND c.name IN ('Contracts', 'Torts')
AND NOT EXISTS (
  SELECT 1 FROM professor_courses pc 
  WHERE pc.professor_id = p.id AND pc.course_id = c.id
);

INSERT INTO professor_courses (professor_id, course_id)
SELECT p.id, c.id
FROM professors p, courses c
WHERE p.name = 'Professor Johnson' AND c.name IN ('Criminal Law', 'Constitutional Law')
AND NOT EXISTS (
  SELECT 1 FROM professor_courses pc 
  WHERE pc.professor_id = p.id AND pc.course_id = c.id
);

INSERT INTO professor_courses (professor_id, course_id)
SELECT p.id, c.id
FROM professors p, courses c
WHERE p.name = 'Professor Williams' AND c.name IN ('Property', 'Civil Procedure')
AND NOT EXISTS (
  SELECT 1 FROM professor_courses pc 
  WHERE pc.professor_id = p.id AND pc.course_id = c.id
);

INSERT INTO professor_courses (professor_id, course_id)
SELECT p.id, c.id
FROM professors p, courses c
WHERE p.name = 'Professor Brown' AND c.name IN ('Evidence', 'Professional Responsibility')
AND NOT EXISTS (
  SELECT 1 FROM professor_courses pc 
  WHERE pc.professor_id = p.id AND pc.course_id = c.id
);

INSERT INTO professor_courses (professor_id, course_id)
SELECT p.id, c.id
FROM professors p, courses c
WHERE p.name = 'Professor Davis' AND c.name IN ('Contracts', 'Property', 'Evidence')
AND NOT EXISTS (
  SELECT 1 FROM professor_courses pc 
  WHERE pc.professor_id = p.id AND pc.course_id = c.id
);

-- Let's also add some additional relationships to make it more interesting
INSERT INTO professor_courses (professor_id, course_id)
SELECT p.id, c.id
FROM professors p, courses c
WHERE p.name = 'Professor Smith' AND c.name = 'Civil Procedure'
AND NOT EXISTS (
  SELECT 1 FROM professor_courses pc 
  WHERE pc.professor_id = p.id AND pc.course_id = c.id
);

INSERT INTO professor_courses (professor_id, course_id)
SELECT p.id, c.id
FROM professors p, courses c
WHERE p.name = 'Professor Johnson' AND c.name = 'Torts'
AND NOT EXISTS (
  SELECT 1 FROM professor_courses pc 
  WHERE pc.professor_id = p.id AND pc.course_id = c.id
);

INSERT INTO professor_courses (professor_id, course_id)
SELECT p.id, c.id
FROM professors p, courses c
WHERE p.name = 'Professor Williams' AND c.name = 'Evidence'
AND NOT EXISTS (
  SELECT 1 FROM professor_courses pc 
  WHERE pc.professor_id = p.id AND pc.course_id = c.id
);

-- Verify the results
SELECT 
  p.name as professor_name,
  c.name as course_name
FROM professors p
JOIN professor_courses pc ON p.id = pc.professor_id
JOIN courses c ON pc.course_id = c.id
ORDER BY p.name, c.name;
