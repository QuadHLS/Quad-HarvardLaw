-- Add visibility state columns to profiles table
-- These columns store boolean values for section visibility on the profile page

ALTER TABLE profiles 
ADD COLUMN clubs_visibility BOOLEAN DEFAULT true,
ADD COLUMN courses_visibility BOOLEAN DEFAULT true,
ADD COLUMN schedule_visibility BOOLEAN DEFAULT true;

-- Add comments to document the purpose of each column
COMMENT ON COLUMN profiles.clubs_visibility IS 'Controls visibility of clubs and activities section on profile page';
COMMENT ON COLUMN profiles.courses_visibility IS 'Controls visibility of current courses section on profile page';
COMMENT ON COLUMN profiles.schedule_visibility IS 'Controls visibility of weekly schedule section on profile page';

-- Optional: Update existing rows to have all sections visible by default
-- UPDATE profiles SET 
--   clubs_visibility = true,
--   courses_visibility = true, 
--   schedule_visibility = true
-- WHERE clubs_visibility IS NULL OR courses_visibility IS NULL OR schedule_visibility IS NULL;
