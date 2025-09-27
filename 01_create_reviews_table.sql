-- Create reviews table with comprehensive schema
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Professor and Course Information
  professor_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  
  -- Academic Information
  semester TEXT NOT NULL CHECK (semester IN ('Fall', 'Winter', 'Spring', 'Summer')),
  year TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('DS', 'H', 'P')),
  
  -- Individual Topic Ratings (1-10 scale)
  readings_rating INTEGER NOT NULL CHECK (readings_rating >= 1 AND readings_rating <= 10),
  cold_calls_rating INTEGER NOT NULL CHECK (cold_calls_rating >= 1 AND cold_calls_rating <= 10),
  exam_rating INTEGER NOT NULL CHECK (exam_rating >= 1 AND exam_rating <= 10),
  
  -- Individual Topic Review Text
  readings_review TEXT NOT NULL,
  cold_calls_review TEXT NOT NULL,
  exam_review TEXT NOT NULL,
  
  -- Overall Class Rating and Review
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 10),
  overall_review TEXT NOT NULL,
  
  -- Course Settings
  laptops_allowed BOOLEAN NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('Project', 'Final Exam', 'Both')),
  has_cold_calls BOOLEAN NOT NULL,
  
  -- Engagement Metrics
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  not_helpful_count INTEGER DEFAULT 0 CHECK (not_helpful_count >= 0),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one review per user per professor/course/semester/year combination
  UNIQUE(user_id, professor_name, course_name, semester, year)
);

-- Create indexes for better query performance
CREATE INDEX idx_reviews_professor_name ON reviews(professor_name);
CREATE INDEX idx_reviews_course_name ON reviews(course_name);
CREATE INDEX idx_reviews_semester_year ON reviews(semester, year);
CREATE INDEX idx_reviews_overall_rating ON reviews(overall_rating DESC);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_professor_course ON reviews(professor_name, course_name);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_reviews_updated_at();

-- Create a view for aggregated professor statistics
CREATE VIEW professor_stats AS
SELECT 
    professor_name,
    course_name,
    COUNT(*) as total_reviews,
    ROUND(AVG(overall_rating), 2) as avg_overall_rating,
    ROUND(AVG(readings_rating), 2) as avg_readings_rating,
    ROUND(AVG(cold_calls_rating), 2) as avg_cold_calls_rating,
    ROUND(AVG(exam_rating), 2) as avg_exam_rating,
    COUNT(CASE WHEN grade = 'DS' THEN 1 END) as ds_count,
    COUNT(CASE WHEN grade = 'H' THEN 1 END) as h_count,
    COUNT(CASE WHEN grade = 'P' THEN 1 END) as p_count,
    COUNT(CASE WHEN laptops_allowed = true THEN 1 END) as laptops_allowed_count,
    COUNT(CASE WHEN assessment_type = 'Final Exam' THEN 1 END) as final_exam_count,
    COUNT(CASE WHEN assessment_type = 'Project' THEN 1 END) as project_count,
    COUNT(CASE WHEN assessment_type = 'Both' THEN 1 END) as both_count,
    COUNT(CASE WHEN has_cold_calls = true THEN 1 END) as cold_calls_count
FROM reviews
GROUP BY professor_name, course_name;

-- Create a view for recent reviews
CREATE VIEW recent_reviews AS
SELECT 
    r.*,
    u.email as user_email
FROM reviews r
LEFT JOIN auth.users u ON r.user_id = u.id
ORDER BY r.created_at DESC;

