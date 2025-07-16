export interface CallAnalysis {
  overallRating: "GOOD" | "BAD" | "UGLY"
  overallScore: number
  toneQuality: {
    agent: string
    customer: string
    score: number
  }
  businessConversion: {
    conversionAchieved: boolean
    conversionType: string
    conversionConfidence: number
  }
  agentPerformance: {
    communicationSkills: number
    problemSolving: number
    productKnowledge: number
    customerService: number
  }
  keyInsights: string[]
  improvementSuggestions: string[]
  callDuration: string
  summary: string
}

export interface TranscriptionResult {
  success: boolean
  data?: {
    transcript: string
    analysis: CallAnalysis
    fileName: string
    fileSize: number
    duration: number
    demo?: boolean
    provider?: string
  }
  error?: string
}
