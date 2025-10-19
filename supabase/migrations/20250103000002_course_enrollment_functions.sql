-- Function to update user enrollments (for onboarding)
CREATE OR REPLACE FUNCTION update_user_enrollments(
  p_user_id UUID,
  p_course_names TEXT[]
)
RETURNS void AS $$
BEGIN
  -- Remove old enrollments
  DELETE FROM course_enrollments WHERE user_id = p_user_id;
  
  -- Add new enrollments
  INSERT INTO course_enrollments (user_id, course_id)
  SELECT p_user_id, fc.id
  FROM feedcourses fc
  WHERE fc.name = ANY(p_course_names);
END;
$$ LANGUAGE plpgsql;

-- Function to get students for a course
CREATE OR REPLACE FUNCTION get_course_students(p_course_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  class_year TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.class_year,
    ce.enrolled_at
  FROM profiles p
  JOIN course_enrollments ce ON p.id = ce.user_id
  WHERE ce.course_id = p_course_id
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql;
