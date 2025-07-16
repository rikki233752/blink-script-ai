-- Fix RLS INSERT Policy for users table
-- This allows authenticated users to insert their own user record during signup

-- First, check if the policy already exists and drop it if needed
DROP POLICY IF EXISTS "Authenticated users can insert themselves" ON public.users;

-- Create the INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert themselves"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = auth_id);

-- Also ensure we have a policy for users to read their own data
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" 
ON public.users
FOR SELECT 
USING (auth.uid() = auth_id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
ON public.users
FOR UPDATE 
USING (auth.uid() = auth_id);

-- Verify RLS is enabled on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT INSERT, SELECT, UPDATE ON public.users TO authenticated;
GRANT USAGE ON SEQUENCE public.users_id_seq TO authenticated;

-- Optional: Create a function to help with user creation
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create trigger to automatically create user profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- Verify the policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';
