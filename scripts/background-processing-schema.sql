-- Create processing jobs table
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('transcribe', 'analyze', 'full_process')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  
  -- Input data
  input_data JSONB NOT NULL,
  
  -- Processing metadata
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  error_details JSONB,
  
  -- Results
  result_data JSONB,
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  retry_after TIMESTAMP WITH TIME ZONE,
  
  -- References
  call_log_id UUID REFERENCES call_logs(id) ON DELETE CASCADE,
  transcription_id UUID REFERENCES transcriptions(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES ai_analysis(id) ON DELETE SET NULL,
  
  -- Indexes
  CONSTRAINT processing_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_priority ON processing_jobs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON processing_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_retry_after ON processing_jobs(retry_after);

-- Create processing queue view for workers
CREATE OR REPLACE VIEW processing_queue AS
SELECT *
FROM processing_jobs
WHERE status IN ('pending', 'retrying')
  AND (retry_after IS NULL OR retry_after <= NOW())
ORDER BY priority DESC, created_at ASC;

-- Create processing statistics table
CREATE TABLE IF NOT EXISTS processing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Counters
  jobs_created INTEGER DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  jobs_failed INTEGER DEFAULT 0,
  
  -- Processing times (in seconds)
  avg_transcription_time NUMERIC,
  avg_analysis_time NUMERIC,
  avg_total_time NUMERIC,
  
  -- Costs (if tracking)
  transcription_cost NUMERIC DEFAULT 0,
  analysis_cost NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Enable RLS on new tables
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for processing_jobs
CREATE POLICY "Users can view own processing jobs" ON processing_jobs
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own processing jobs" ON processing_jobs
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own processing jobs" ON processing_jobs
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- RLS policies for processing_stats
CREATE POLICY "Users can view own processing stats" ON processing_stats
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own processing stats" ON processing_stats
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own processing stats" ON processing_stats
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Admin policies
CREATE POLICY "Admin can view all processing jobs" ON processing_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin can view all processing stats" ON processing_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role = 'admin'
    )
  );
