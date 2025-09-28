-- Add missing constraints to existing exams table to match outlines table

-- Add file_type constraint
ALTER TABLE exams 
ADD CONSTRAINT exams_file_type_check 
CHECK (file_type IN ('pdf', 'docx'));

-- Add rating constraint  
ALTER TABLE exams 
ADD CONSTRAINT exams_rating_check 
CHECK (rating >= 0 AND rating <= 5);
