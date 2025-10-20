-- Migration: Setup automatic syncing of course_enrollments table from profiles.classes
-- This ensures course_enrollments stays in sync with the user's enrolled courses

-- Step 1: Create function to sync enrollments from profiles.classes
CREATE OR REPLACE FUNCTION sync_course_enrollments(p_user_id UUID)
RETURNS void 
SECURITY DEFINER  -- Allows function to bypass RLS when called from triggers
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remove old enrollments for this user
  DELETE FROM course_enrollments WHERE user_id = p_user_id;
  
  -- Add new enrollments based on profiles.classes
  INSERT INTO course_enrollments (user_id, course_id)
  WITH extracted_courses AS (
    SELECT 
      p_user_id as user_id,
      (jsonb_array_elements(classes)->>'course_id')::uuid as course_id
    FROM profiles
    WHERE id = p_user_id
      AND classes IS NOT NULL
      AND jsonb_array_length(classes) > 0
  )
  SELECT user_id, course_id
  FROM extracted_courses
  WHERE course_id IS NOT NULL;
END;
$$;

-- Step 2: Create trigger function with error handling
CREATE OR REPLACE FUNCTION trigger_sync_course_enrollments()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only sync if classes column was updated
  IF (TG_OP = 'INSERT' AND NEW.classes IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.classes IS DISTINCT FROM OLD.classes) THEN
    
    BEGIN
      PERFORM sync_course_enrollments(NEW.id);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to sync enrollments for user %: % %', NEW.id, SQLERRM, SQLSTATE;
        -- Don't fail the insert/update, just log the error
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger for profile updates
DROP TRIGGER IF EXISTS sync_enrollments_on_profile_update ON profiles;
CREATE TRIGGER sync_enrollments_on_profile_update
AFTER UPDATE ON profiles  -- Fires on any update (function checks if classes changed)
FOR EACH ROW
EXECUTE FUNCTION trigger_sync_course_enrollments();

-- Step 4: Create trigger for new profiles
DROP TRIGGER IF EXISTS sync_enrollments_on_profile_insert ON profiles;
CREATE TRIGGER sync_enrollments_on_profile_insert
AFTER INSERT ON profiles
FOR EACH ROW
WHEN (NEW.classes IS NOT NULL)
EXECUTE FUNCTION trigger_sync_course_enrollments();

