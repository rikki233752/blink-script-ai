-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ringba_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ringba_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ringba_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Admin can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Ringba accounts policies
CREATE POLICY "Users can view own ringba accounts" ON ringba_accounts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ringba accounts" ON ringba_accounts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ringba accounts" ON ringba_accounts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own ringba accounts" ON ringba_accounts
  FOR DELETE USING (user_id = auth.uid());

-- Ringba campaigns policies
CREATE POLICY "Users can view own campaigns" ON ringba_campaigns
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own campaigns" ON ringba_campaigns
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own campaigns" ON ringba_campaigns
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own campaigns" ON ringba_campaigns
  FOR DELETE USING (user_id = auth.uid());

-- Ringba call logs policies
CREATE POLICY "Users can view own call logs" ON ringba_call_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own call logs" ON ringba_call_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own call logs" ON ringba_call_logs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own call logs" ON ringba_call_logs
  FOR DELETE USING (user_id = auth.uid());

-- AI analysis policies
CREATE POLICY "Users can view own ai analysis" ON ai_analysis
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ai analysis" ON ai_analysis
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ai analysis" ON ai_analysis
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own ai analysis" ON ai_analysis
  FOR DELETE USING (user_id = auth.uid());

-- Integrations policies
CREATE POLICY "Users can view own integrations" ON integrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own integrations" ON integrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own integrations" ON integrations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own integrations" ON integrations
  FOR DELETE USING (user_id = auth.uid());

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (user_id = auth.uid());

-- Create function to get current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE auth_id = auth.uid();
$$;
