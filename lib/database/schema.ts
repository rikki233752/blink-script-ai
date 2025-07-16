// Campaign types
export interface Campaign {
  id: string
  name: string
  description: string
  status: "active" | "paused" | "completed" | "draft"
  type?: string // Added type field
  targetCalls?: number
  budget?: number
  startDate: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
  createdBy: string
  settings: {
    qualityThreshold: number
    autoApproval: boolean
    recordingEnabled: boolean
    transcriptionEnabled: boolean
  }
}

// Call types
export interface Call {
  id: string
  campaignId: string
  agentId: string
  phoneNumber: string
  duration: number // in seconds
  status: "completed" | "missed" | "busy" | "no-answer"
  disposition: "sale" | "no-sale" | "callback" | "not-interested"
  qualityScore?: number
  sentiment?: "positive" | "negative" | "neutral"
  startTime: Date
  endTime?: Date
  metadata?: {
    leadSource?: string
    notes?: string
    [key: string]: any
  }
}

// Quality Review types
export interface QualityReview {
  id: string
  callId: string
  campaignId: string
  reviewerId: string
  status: "approved" | "rejected" | "pending"
  score: number
  feedback: string
  criteria: {
    greeting: number
    productKnowledge: number
    objectionHandling: number
    closing: number
    compliance: number
    [key: string]: number
  }
  reviewedAt: Date
}
