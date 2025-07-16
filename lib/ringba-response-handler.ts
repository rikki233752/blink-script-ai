export interface RingBAApiResponse {
  isSuccessful: boolean
  transactionId: string
  report: {
    partialResult: boolean
    records: RingBACallRecord[]
    totalCount: number
  }
}

export interface RingBACallRecord {
  campaignName: string
  publisherName: string
  targetName: string
  targetNumber: string
  campaignId: string
  publisherId: string
  publisherSubId: string
  targetId: string
  inboundCallId: string
  callDt: number // Unix timestamp in milliseconds
  inboundPhoneNumber: string
  number: string
  numberId: string
  isFromNumberPool: boolean
  numberPoolId: string
  numberPoolName: string
  timeToCallInSeconds: number
  callCompletedDt: number
  callConnectionDt: number
  callLengthInSeconds: number
  connectedCallLengthInSeconds: number
  endCallSource: string
  hasConnected: boolean
  hasPayout: boolean
  hasAnnotations?: boolean
  hasPreviouslyConnected: boolean
  hasRecording: boolean
  hasConverted: boolean
  isLive: boolean
  conversionAmount: number
  profitNet: number
  profitGross: number
  payoutAmount: number
  totalCost: number
  telcoCost: number
  recordingUrl: string
  timeToConnectInSeconds: number
}

export interface TransformedCallLog {
  id: string
  campaignId: string
  campaignName: string
  callerId: string
  startTime: string
  duration: number
  connectedDuration: number
  hasRecording: boolean
  recordingUrl: string | null
  agentName: string
  targetNumber: string
  status: "connected" | "not-connected"
  disposition: "converted" | "not-converted"
  endCallSource: string
  timeToConnect: number
  revenue: number
  cost: number
  profit: number
  publisherName: string
  hasAnnotations: boolean
  isLive: boolean
}

export class RingBAResponseHandler {
  /**
   * Transform RingBA API response to standardized format
   */
  static transformResponse(apiResponse: RingBAApiResponse): {
    success: boolean
    callLogs: TransformedCallLog[]
    totalCount: number
    transactionId: string
    partialResult: boolean
  } {
    if (!apiResponse.isSuccessful) {
      return {
        success: false,
        callLogs: [],
        totalCount: 0,
        transactionId: apiResponse.transactionId,
        partialResult: false,
      }
    }

    const transformedLogs: TransformedCallLog[] = apiResponse.report.records.map((record) => ({
      id: record.inboundCallId,
      campaignId: record.campaignId,
      campaignName: record.campaignName,
      callerId: record.inboundPhoneNumber,
      startTime: new Date(record.callDt).toISOString(),
      duration: record.callLengthInSeconds,
      connectedDuration: record.connectedCallLengthInSeconds,
      hasRecording: record.hasRecording,
      recordingUrl: record.recordingUrl,
      agentName: record.targetName,
      targetNumber: record.targetNumber,
      status: record.hasConnected ? "connected" : "not-connected",
      disposition: record.hasConverted ? "converted" : "not-converted",
      endCallSource: record.endCallSource,
      timeToConnect: record.timeToConnectInSeconds,
      revenue: record.conversionAmount,
      cost: record.totalCost,
      profit: record.profitNet,
      publisherName: record.publisherName,
      hasAnnotations: record.hasAnnotations || false,
      isLive: record.isLive,
    }))

    return {
      success: true,
      callLogs: transformedLogs,
      totalCount: apiResponse.report.totalCount,
      transactionId: apiResponse.transactionId,
      partialResult: apiResponse.report.partialResult,
    }
  }

  /**
   * Format duration in MM:SS format
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  /**
   * Format currency values
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  /**
   * Get call quality score based on duration and connection
   */
  static getCallQuality(record: TransformedCallLog): "excellent" | "good" | "fair" | "poor" {
    if (!record.status.includes("connected")) return "poor"
    if (record.connectedDuration >= 60) return "excellent"
    if (record.connectedDuration >= 30) return "good"
    if (record.connectedDuration >= 10) return "fair"
    return "poor"
  }
}
