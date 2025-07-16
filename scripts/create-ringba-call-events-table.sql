-- Create ringba_call_events table for storing pixel webhook data
CREATE TABLE IF NOT EXISTS public.ringba_call_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    call_id VARCHAR(255) NOT NULL,
    campaign_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    caller_number VARCHAR(50),
    target_number VARCHAR(50),
    call_duration INTEGER DEFAULT 0,
    conversion_value DECIMAL(10,2) DEFAULT 0,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ringba_call_events_user_id ON public.ringba_call_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ringba_call_events_call_id ON public.ringba_call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_ringba_call_events_campaign_id ON public.ringba_call_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ringba_call_events_event_type ON public.ringba_call_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ringba_call_events_created_at ON public.ringba_call_events(created_at);

-- Enable RLS
ALTER TABLE public.ringba_call_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own call events" ON public.ringba_call_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call events" ON public.ringba_call_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own call events" ON public.ringba_call_events
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ringba_call_events_updated_at 
    BEFORE UPDATE ON public.ringba_call_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
