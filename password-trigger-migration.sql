-- Create a function to set password for invited users after email confirmation
CREATE OR REPLACE FUNCTION set_password_for_invited_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is an email confirmation and user has password in metadata
  IF NEW.email_confirmed_at IS NOT NULL 
     AND OLD.email_confirmed_at IS NULL 
     AND NEW.raw_user_meta_data ? 'password' THEN
    
    -- Update the user with the password from metadata
    UPDATE auth.users 
    SET encrypted_password = crypt(NEW.raw_user_meta_data->>'password', gen_salt('bf'))
    WHERE id = NEW.id;
    
    -- Remove password from metadata for security
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data - 'password'
    WHERE id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run the function when user email is confirmed
DROP TRIGGER IF EXISTS trigger_set_password_for_invited_user ON auth.users;
CREATE TRIGGER trigger_set_password_for_invited_user
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION set_password_for_invited_user();
