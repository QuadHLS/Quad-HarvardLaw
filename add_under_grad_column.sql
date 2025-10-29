-- Add under_grad column to profiles table
-- This column stores text information about undergraduate education

ALTER TABLE profiles 
ADD COLUMN under_grad TEXT;

-- Add comment to document the purpose of the column
COMMENT ON COLUMN profiles.under_grad IS 'Stores undergraduate education information for the user';


