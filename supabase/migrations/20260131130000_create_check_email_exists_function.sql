-- Create a function to check if email exists (accessible without RLS restrictions)
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check text) RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE email = email_to_check
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_email_exists(text) TO authenticated,
    anon;