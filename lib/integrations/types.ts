export interface Integration {
  id: string
  name: string
  type: "ringba" | "twilio" | "aircall" | "dialpad" | "five9" | "genesys" | "custom"
  status: "active" | "inactive" | "error" | "configuring"
  config: IntegrationConfig
  lastSync: string
  totalCalls: number
  successRate: number
  errorCount: number
  createdAt: string
  updatedAt: string
}

export interface IntegrationConfig {
  apiKey?: string
  apiSecret?: string
  accountId?: string
  endpoint?: string
  webhookUrl?: string
  syncInterval: number // minutes
  autoTranscribe: boolean
  autoAnalyze: boolean
  filters: CallFilters
  retryAttempts: number
  timeout: number
}

export interface CallFilters {
  minDuration?: number
  maxDuration?: number
  dateRange?: {
    start: string
    end: string
  }
  campaigns?: string[]
  agents?: string[]
  dispositions?: string[]
  directions?: ("inbound" | "outbound")[]
}

export interface CallRecord {
  id: string
  integrationId: string
  externalId: string
  direction: "inbound" | "outbound"
  fromNumber: string
  toNumber: string
  duration: number
  startTime: string
  endTime: string
  recordingUrl?: string
  campaignId?: string
  agentId?: string
  customerId?: string
  disposition?: string
  status: "pending" | "processing" | "completed" | "failed"
  transcriptionStatus: "pending" | "processing" | "completed" | "failed"
  analysisStatus: "pending" | "processing" | "completed" | "failed"
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface SyncResult {
  success: boolean
  callsFound: number
  callsProcessed: number
  callsFailed: number
  errors: string[]
  nextSyncTime: string
}
