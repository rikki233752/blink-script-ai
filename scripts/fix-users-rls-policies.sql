-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy for service role (full access)
CREATE POLICY "Service role can manage all users" ON public.users
FOR ALL USING (
  auth.role() = 'service_role'
);

-- Policy for authenticated users to view their own data
CREATE POLICY "Users can view their own data" ON public.users
FOR SELECT USING (
  auth.uid()::text = id OR auth.role() = 'service_role'
);

-- Policy for authenticated users to update their own data
CREATE POLICY "Users can update their own data" ON public.users
FOR UPDATE USING (
  auth.uid()::text = id OR auth.role() = 'service_role'
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
