-- Create course_enrollments table
CREATE TABLE course_enrollments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES feedcourses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create indexes for fast lookups
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_user_id ON course_enrollments(user_id);

-- Add RLS policies
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view enrollments for courses they're enrolled in
CREATE POLICY "Users can view enrollments for their courses" ON course_enrollments
  FOR SELECT USING (
    course_id IN (
      SELECT ce.course_id FROM course_enrollments ce WHERE ce.user_id = auth.uid()
    )
  );

-- Policy: Users can manage their own enrollments
CREATE POLICY "Users can manage their own enrollments" ON course_enrollments
  FOR ALL USING (user_id = auth.uid());
