// OnScript AI-style data structure
export interface OnScriptCampaign {
  id: string
  name: string
  status: "active" | "inactive" | "paused"
  description?: string
  createdDate: string
  totalCalls: number
  totalCallLogs: number
  callsWithRecordings: number
  averageDuration: number
  conversionRate: number
  revenue: number
  lastActivity: string
}

export interface OnScriptCallLog {
  id: string
  campaignId: string
  campaignName: string
  callId: string
  agentName: string
  customerPhone: string
  direction: "inbound" | "outbound"
  duration: number
  startTime: string
  endTime: string
  status: "completed" | "missed" | "busy" | "no-answer"
  disposition: string
  hasRecording: boolean
  recordingUrl?: string
  hasTranscription: boolean
  hasAnalysis: boolean
  revenue?: number
  cost?: number
  trackingNumber?: string
  metadata: any
}

export interface OnScriptCallDetails {
  callLogId: string
  campaignId: string
  transcript?: string
  analysis?: {
    overallRating: "GOOD" | "BAD" | "UGLY"
    overallScore: number
    agentPerformance: {
      communicationSkills: number
      problemSolving: number
      productKnowledge: number
      customerService: number
    }
    businessConversion: {
      conversionAchieved: boolean
      conversionType: string
      conversionConfidence: number
      conversionStage: string
    }
    sentimentAnalysis: {
      agentSentiment: any
      customerSentiment: any
      overallCallSentiment: any
    }
    keyInsights: string[]
    improvementSuggestions: string[]
    callQualityMetrics: any
    vocalyticsReport: any
  }
  provider: string
  processedAt: string
  fileName: string
  fileSize: number
}
