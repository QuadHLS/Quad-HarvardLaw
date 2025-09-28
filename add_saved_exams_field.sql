-- Add saved_exams field to profiles table
-- This field will store an array of exam IDs that the user has saved

-- Add the saved_exams column to the profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS saved_exams TEXT[] DEFAULT '{}';

-- Create an index for better performance when querying saved exams
CREATE INDEX IF NOT EXISTS idx_profiles_saved_exams ON profiles USING GIN (saved_exams);

-- Add a comment to document the field
COMMENT ON COLUMN profiles.saved_exams IS 'Array of exam IDs that the user has saved for quick access';
