-- Create campaign integrations table for storing integration settings
CREATE TABLE IF NOT EXISTS campaign_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES onscript_campaigns(id) ON DELETE CASCADE,
  
  -- RingBA Integration Settings
  ringba_enabled boolean DEFAULT false,
  ringba_sync_call_logs boolean DEFAULT true,
  ringba_webhook_url text,
  ringba_last_sync timestamp,
  
  -- Deepgram Integration Settings
  deepgram_enabled boolean DEFAULT false,
  deepgram_model text DEFAULT 'nova-2',
  deepgram_features text[] DEFAULT ARRAY['punctuation', 'diarization', 'sentiment'],
  deepgram_language text DEFAULT 'en-US',
  
  -- OpenAI Integration Settings (for analysis)
  openai_enabled boolean DEFAULT true,
  openai_model text DEFAULT 'gpt-4',
  openai_analysis_prompt text,
  
  -- Webhook Settings
  webhook_url text,
  webhook_secret text,
  webhook_events text[] DEFAULT ARRAY['call_transcribed', 'analysis_completed'],
  
  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_integrations_campaign_id ON campaign_integrations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_integrations_ringba_enabled ON campaign_integrations(ringba_enabled);
CREATE INDEX IF NOT EXISTS idx_campaign_integrations_deepgram_enabled ON campaign_integrations(deepgram_enabled);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaign_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_campaign_integrations_updated_at
  BEFORE UPDATE ON campaign_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_integrations_updated_at();
