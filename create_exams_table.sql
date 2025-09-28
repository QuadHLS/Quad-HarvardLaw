-- Create exams table with exact same schema as outlines table
CREATE TABLE exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  instructor TEXT NOT NULL,
  year TEXT NOT NULL,
  pages INTEGER NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  grade TEXT NOT NULL,
  description TEXT,
  rating_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Constraints
  UNIQUE(file_path), -- Ensure no duplicate file paths
  CHECK (pages > 0),
  CHECK (file_size > 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_exams_course ON exams(course);
CREATE INDEX idx_exams_instructor ON exams(instructor);
CREATE INDEX idx_exams_year ON exams(year);
CREATE INDEX idx_exams_grade ON exams(grade);
CREATE INDEX idx_exams_rating ON exams(rating DESC);
CREATE INDEX idx_exams_created_at ON exams(created_at DESC);
CREATE INDEX idx_exams_course_instructor ON exams(course, instructor);
CREATE INDEX idx_exams_course_instructor_year ON exams(course, instructor, year);
CREATE INDEX idx_exams_course_instructor_year_grade ON exams(course, instructor, year, grade);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_exams_updated_at 
    BEFORE UPDATE ON exams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_exams_updated_at();

-- Enable Row Level Security
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can read exams" ON exams
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert exams" ON exams
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update exams" ON exams
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete exams" ON exams
    FOR DELETE
    USING (auth.role() = 'authenticated');
