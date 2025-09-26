-- Create outlines table with comprehensive schema including file size
CREATE TABLE outlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- File information
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx')),
  file_size BIGINT NOT NULL, -- File size in bytes
  
  -- Course and instructor information
  course TEXT NOT NULL,
  instructor TEXT NOT NULL,
  
  -- Academic information
  year TEXT NOT NULL,
  grade TEXT NOT NULL,
  
  -- Content information
  pages INTEGER NOT NULL,
  description TEXT,
  
  -- User interaction fields
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  rating_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(file_path), -- Ensure no duplicate file paths
  CHECK (pages > 0),
  CHECK (file_size > 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_outlines_course ON outlines(course);
CREATE INDEX idx_outlines_instructor ON outlines(instructor);
CREATE INDEX idx_outlines_year ON outlines(year);
CREATE INDEX idx_outlines_grade ON outlines(grade);
CREATE INDEX idx_outlines_rating ON outlines(rating DESC);
CREATE INDEX idx_outlines_created_at ON outlines(created_at DESC);
CREATE INDEX idx_outlines_course_instructor ON outlines(course, instructor);
CREATE INDEX idx_outlines_course_instructor_year ON outlines(course, instructor, year);
CREATE INDEX idx_outlines_course_instructor_year_grade ON outlines(course, instructor, year, grade);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_outlines_updated_at 
    BEFORE UPDATE ON outlines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE outlines ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read outlines
CREATE POLICY "Allow all users to read outlines" ON outlines
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to update ratings and download counts
CREATE POLICY "Allow authenticated users to update outlines" ON outlines
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert new outlines (for admin uploads)
CREATE POLICY "Allow authenticated users to insert outlines" ON outlines
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON outlines TO anon, authenticated;
GRANT INSERT, UPDATE ON outlines TO authenticated;